# Quick Release Guide

## Release a New Version in 3 Steps

### 1. Prepare
```bash
# Make sure you're on main branch and up to date
git checkout main
git pull origin main

# Verify everything builds
dotnet build SwaggerWithSwagg/SwaggerWithSwagg.csproj --configuration Release
```

### 2. Tag
```bash
# Replace 1.x.x with your version number
git tag v1.0.0
```

### 3. Push
```bash
# Push the tag to trigger deployment
git push origin v1.0.0
```

That's it! GitHub Actions will automatically:
✅ Build the project
✅ Run tests
✅ Create NuGet package
✅ Publish to NuGet.org
✅ Create GitHub Release

## Common Version Bumps

```bash
# Patch release (bug fixes): 1.0.0 → 1.0.1
git tag v1.0.1 && git push origin v1.0.1

# Minor release (new features): 1.0.1 → 1.1.0
git tag v1.1.0 && git push origin v1.1.0

# Major release (breaking changes): 1.1.0 → 2.0.0
git tag v2.0.0 && git push origin v2.0.0

# Pre-release (beta/alpha)
git tag v1.2.0-beta.1 && git push origin v1.2.0-beta.1
```

## Check Status

- **GitHub Actions**: https://github.com/yourusername/SwaggerWithSwagg/actions
- **NuGet Package**: https://www.nuget.org/packages/SwaggerWithSwagg
- **Latest Release**: https://github.com/yourusername/SwaggerWithSwagg/releases/latest

## Rollback a Tag

If you made a mistake:

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0
```

## Version History

Track your releases:

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | TBD  | Initial release |

## Need Help?

See [DEPLOYMENT.md](.github/DEPLOYMENT.md) for detailed instructions.
