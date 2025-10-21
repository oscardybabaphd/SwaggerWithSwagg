# SwaggerWithSwagg - GitHub Actions Setup

This repository uses GitHub Actions to automate building, testing, and publishing to NuGet.

## Workflows

### 1. Build and Test (`build.yml`)
- **Triggers**: Runs on every push/PR to `main` or `develop` branches
- **Purpose**: Validates that the code builds and tests pass
- **Artifact**: Creates a NuGet package as an artifact (not published)

### 2. Publish to NuGet (`nuget-publish.yml`)
- **Triggers**: 
  - Automatically when you push a version tag (e.g., `v1.0.0`)
  - Manually via workflow dispatch
- **Purpose**: Builds and publishes the package to NuGet.org
- **Outputs**: 
  - NuGet package published to nuget.org
  - GitHub Release created with package attached
  - Artifacts uploaded to GitHub

## Setup Instructions

### 1. Create a NuGet API Key

1. Go to [NuGet.org](https://www.nuget.org/)
2. Sign in or create an account
3. Click your username → **API Keys**
4. Click **Create** and configure:
   - **Key Name**: `SwaggerWithSwagg-GitHub-Actions`
   - **Package Owner**: Select your account
   - **Scopes**: Select "Push new packages and package versions"
   - **Glob Pattern**: `SwaggerWithSwagg`
   - **Expiration**: Set as needed (e.g., 365 days)
5. Click **Create**
6. **Copy the API key** (you won't see it again!)

### 2. Add the API Key to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NUGET_API_KEY`
5. Value: Paste your NuGet API key
6. Click **Add secret**

### 3. Update Package Metadata

Edit `SwaggerWithSwagg/SwaggerWithSwagg.csproj`:

```xml
<PropertyGroup>
  <PackageId>SwaggerWithSwagg</PackageId>
  <Version>1.0.0</Version>
  <Authors>Your Name</Authors>
  <Company>Your Company</Company>
  <Description>Enhanced Swagger UI with Postman-like interface for ASP.NET Core</Description>
  <PackageTags>swagger;openapi;api;documentation;postman;aspnetcore</PackageTags>
  <PackageProjectUrl>https://github.com/yourusername/SwaggerWithSwagg</PackageProjectUrl>
  <RepositoryUrl>https://github.com/yourusername/SwaggerWithSwagg</RepositoryUrl>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <PackageReadmeFile>README.md</PackageReadmeFile>
  <PackageIcon>icon.png</PackageIcon>
</PropertyGroup>
```

## Publishing a New Version

### Method 1: Using Git Tags (Recommended)

1. **Update version in code** (optional - the tag version will override):
   ```bash
   # Edit SwaggerWithSwagg/SwaggerWithSwagg.csproj
   # Change <Version>1.0.0</Version> to your new version
   ```

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Release v1.2.3"
   ```

3. **Create and push a version tag**:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

4. **GitHub Actions will automatically**:
   - Build the project
   - Run tests
   - Create NuGet package with version 1.2.3
   - Publish to NuGet.org
   - Create a GitHub Release

### Method 2: Manual Workflow Dispatch

1. Go to **Actions** tab in your GitHub repository
2. Select **Publish to NuGet** workflow
3. Click **Run workflow**
4. Enter the version number (e.g., `1.2.3`)
5. Click **Run workflow**

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backwards compatible)
  - **PATCH**: Bug fixes (backwards compatible)

### Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - Added new features
- `v1.1.1` - Bug fixes
- `v2.0.0` - Breaking changes

## Pre-release Versions

For beta/alpha releases:

```bash
# Beta release
git tag v1.2.0-beta.1
git push origin v1.2.0-beta.1

# Alpha release
git tag v2.0.0-alpha.1
git push origin v2.0.0-alpha.1
```

## Checking Published Package

After publishing, verify at:
- **NuGet.org**: https://www.nuget.org/packages/SwaggerWithSwagg
- **GitHub Releases**: https://github.com/yourusername/SwaggerWithSwagg/releases

## Troubleshooting

### Build Fails
- Check the **Actions** tab for error details
- Ensure .NET 9.0 SDK is compatible
- Verify all dependencies are restored

### NuGet Push Fails
- **401 Unauthorized**: Check if `NUGET_API_KEY` secret is set correctly
- **403 Forbidden**: Verify API key has push permissions for the package
- **409 Conflict**: Version already exists on NuGet (bump version number)

### Version Not Updated
- Ensure you're using a tag that starts with `v` (e.g., `v1.0.0`)
- Check that the version format is correct (MAJOR.MINOR.PATCH)

## Local Testing

Test package creation locally before publishing:

```bash
# Build and pack
dotnet pack SwaggerWithSwagg/SwaggerWithSwagg.csproj --configuration Release --output ./artifacts

# Test the package locally
dotnet add package SwaggerWithSwagg --source ./artifacts
```

## Rollback

If you need to unlist a version:

1. Go to [NuGet.org](https://www.nuget.org/)
2. Navigate to your package
3. Click **Manage Package**
4. Select the version → **Unlist**

Note: Unlisting doesn't delete the version, it just hides it from search results.
