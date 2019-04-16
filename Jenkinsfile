node("slave-two") {
    stage("prepare repo") {
         checkout scm
    }

    stage("Install NPM") {
         sh "npm install"
    }

    stage("Run Test") {
        sh "npm run test-api"
    }
}