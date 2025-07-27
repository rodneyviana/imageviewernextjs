# Instructions for Copilot

## git check in and creating versions (when user says "check in" or "commit changes")


1. **Analyze Changes**
   - Test if the project is compiling `npm run build`
   - Use `git diff` to identify what files changed since the last commit
   - If changes are not obvious from the diff, ask the user: "What changes were made in this update?"
   - Document all changes between commits in README.md (general) and CHANGELOG.md (detailed)
2. **Commit Changes**
   - Use `git commit -m "Description of changes"` to commit changes
   - Ensure the commit message is clear and concise
3. **Create Version Tags**
   - change the version number in `package.json` and `CHANGELOG.md`
   - Use `git tag -a vX.Y.Z -m "Version X.Y.Z"` to create a new version tag
   - Stablish if the changes are minor or new version
   - Increment the version number according to semantic versioning (major.minor.patch), it is always (1.<n+1>.0) for new versions
   - For minor changes, increment the patch version by 100 (e.g., 1.0.100 to 1.0.200, etc)
   - Push the changes and tags to the remote repository using `git push && git push --tags`


