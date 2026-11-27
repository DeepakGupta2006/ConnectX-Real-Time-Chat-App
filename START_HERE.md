# 0 – Shared starter (Deepak pushes this first)

These are the project-setup files every member needs (package.json files, .gitignore, README, TEAM_GUIDE, screenshots).
They contain **no feature code**. Deepak creates the GitHub repo and pushes this folder first, then the others join.

## Steps (Deepak)
1. github.com → New repository → `ConnectX-Real-Time-Chat-App` (Public, no README) → Create.
2. Settings → Collaborators → add the other 3 members.
3. Open a terminal INSIDE this folder (`0_Starter_Shared_Deepak_creates_repo`) and run:

```bash
git init -b main
git add .
git commit -m "chore: project setup, README and team guide"
git remote add origin https://github.com/USERNAME/ConnectX-Real-Time-Chat-App.git
git push -u origin main
git checkout -b develop
git push -u origin develop
```
(Replace USERNAME with your GitHub username.)

4. Tell the 3 teammates the repo is ready. Then do your own Member 1 work (folder `1_Member1_Frontend`).
