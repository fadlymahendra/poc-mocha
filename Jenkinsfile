pipeline {
    agent any 
    stages {
        stage('Build') { 
            steps {
                sh 'npm install'
            }
        }
        stage('Automation Test') { 
            steps {
                sh 'npm run test-api'
            }
        }
        stage('Deploy') { 
            steps {
                sh 'rm -rf node_modules' 
            }
        }
    }
}