#!/usr/bin/env groovy
def commons
node("sdet-node-staging") {
  timestamps {
    wrap([$class: "AnsiColorBuildWrapper", "colorMapName": "XTerm", "defaultFg": 1, "defaultBg": 2]) {
      def pipelines
      def currentDir = pwd()
      def VERSION

      stage("Prepare the Repo") {
        step([$class: 'WsCleanup'])
        checkout scm
        commons = load 'common.groovy'
        pipelines = load "${currentDir}/pipeline.groovy"
        def HEAD_REF = pipelines.getCommitHash()
        VERSION = "$HEAD_REF"
      }

      stage("Labelling") {
        currentBuild.displayName = "#$env.BUILD_NUMBER-git--$VERSION"
      }

      stage("Unit Testing & Static Analysis") {
        bitbucketStatusNotify(
          buildState: 'INPROGRESS',
          buildKey: 'unit-test',
          buildName: 'unit-test'
        )
        int x = 0
        try {
          sh "whoami"
          withEnv(["PATH+=/home/ubuntu/.nvm/versions/node/v8.15.0/bin:/home/ubuntu/sonar-scanner-3.0/bin"]) {
            sh "aws s3 cp s3://bizzy-sams/sdet/staging/jenkins_config/runner-unittest-sonar.sh ./runner-unittest-sonar.sh"
            sh "echo $PATH"
            sh "node -v"
            sh "npm -v"
            sh """#!/bin/bash
              chmod +x *.sh
              ./runner-unittest-sonar.sh
            """
          }
        } catch(Exception e) {
          x=-1
        }
        commons.publishHTMLReports("reports","bizzy-purchaseorder.html, bizzy-purchaseorder-pubsub.html", "Unit Test Report")
        commons.publishHTMLReports("modules/bizzy-purchaseorder/coverage/lcov-report/","index.html", "Coverage Test Purchaseorder")
        commons.publishHTMLReports("modules/bizzy-purchaseorder-pubsub/coverage/lcov-report/","index.html", "Coverage Test Purchaseorder Pubsub")

        if (x<0){
          bitbucketStatusNotify(
            buildState: 'FAILED',
            buildKey: 'unit-test',
            buildName: 'unit-test',
            buildDescription: 'Something went wrong with Unit Testing!'
          )
          sh ('exit 1')
        }else{
          bitbucketStatusNotify(
            buildState: 'SUCCESSFUL',
            buildKey: 'unit-test',
            buildName: 'unit-test'
          )
        }
      }

      stage("Deploy to Staging Lambda") {
        withEnv(["PATH+=/home/ubuntu/.local/bin:/home/ubuntu/.nvm/versions/node/v8.15.0/bin:/home/ubuntu/sonar-scanner-3.0/bin"]) {
          sh """#!/bin/bash
                ./deploy-staging.sh
            """
        }
      }

      stage("Seeding Data") {
        bitbucketStatusNotify(
          buildState: 'INPROGRESS',
          buildKey: 'data-seed',
          buildName: 'data-seed'
        )
        try {
          withEnv(["PATH+=/usr/bin/:/home/ubuntu/.nvm/versions/node/v8.15.0/bin"]) {
            sh "aws s3 cp s3://bizzy-sams/sdet/staging/seed_data/purchase sdet_test/data_seed --recursive"
            sh "chmod +x -R sdet_test/data_seed"
            dir ('sdet_test/data_seed') {
                sh "./prepare_order_tracking_data_rds.sh"
                sh "./seed_po_vendor_api.sh"
                sh "./delete_data_mongo.sh"
                sh "./insert_data_mongo.sh"
                sh "./prepare_blanket_po.sh"
            }
          }
          bitbucketStatusNotify(
            buildState: 'SUCCESSFUL',
            buildKey: 'data-seed',
            buildName: 'data-seed'
          )
        }catch(Exception e){
          bitbucketStatusNotify(
            buildState: 'FAILED',
            buildKey: 'data-seed',
            buildName: 'data-seed',
            buildDescription: 'Something went wrong with Data Seed'
          )
        }
      }

      stage("Functional Automation Testing"){
        bitbucketStatusNotify(
          buildState: 'INPROGRESS',
          buildKey: 'AT',
          buildName: 'AT'
        )

        int x = 0
        withEnv(["PATH+=/home/ubuntu/.local/bin:/home/ubuntu/.nvm/versions/node/v8.15.0/bin:/home/ubuntu/sonar-scanner-3.0/bin"]) {
          dir ('sdet_test'){
            sh "aws s3 cp s3://bizzy-sams/sdet/staging/bizzy-purchaseorder.env ./.env"

            // prevent npm to store cache on the host machine
            docker.image('bizzy:sdet-test').inside {
              sh "rm -f package-lock.json"
              sh "npm install --package-lock-only"
              sh "npm ci"

              try{
                  sh "npm run test-api -- --grep @skip --invert"
              }catch(Exception error){
                x=-1
              }
            }

            sh "npm run send-log-elk"
            commons.publishHTMLReports("reports/mochawesome","mochawesome.html", "API Functional Test")

          }
          dir ('sdet_test/data_seed') {
            sh "./clean_up_order_tracking_data_rds.sh"
            sh "./delete_data_mongo.sh"
          }

          if (x<0){
            dir ('sdet_test/data_seed') {
              sh "./clean_up_order_tracking_data_rds.sh"
              sh "./delete_data_mongo.sh"
            }
            bitbucketStatusNotify(
              buildState: 'FAILED',
              buildKey: 'AT',
              buildName: 'AT',
              buildDescription: 'Something went wrong with Automation Testing!'
            )
            sh ('exit 1')
          } else {
            bitbucketStatusNotify(
              buildState: 'SUCCESSFUL',
              buildKey: 'AT',
              buildName: 'AT'
            )
          }
        }
      }
    }
  }
}
