# Jenkins runtime for QA pipeline

This folder contains a Jenkins image that already includes:

- `docker`
- `docker compose`
- `git`
- `node`
- `npm`

Use it when the pipeline fails with errors such as:

- `docker: not found`
- `node: not found`

## Start Jenkins

1. Copy `.env.example` to `.env` and replace the Jira placeholders.
2. Run:

```bash
docker compose -f infrastructure/jenkins/docker-compose.jenkins.yml up -d --build
```

3. Open [http://localhost:8080](http://localhost:8080)
4. Unlock Jenkins:

```bash
docker exec bicap-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## Jenkins job settings

- Job type: `Pipeline`
- SCM: `Git`
- Repository: `https://github.com/Bao1803-H/KCPM.git`
- Script Path: `BICAP-main/Jenkinsfile`

After the first successful load, Jenkins will show `Build with Parameters` for `QA_SCOPE`.
