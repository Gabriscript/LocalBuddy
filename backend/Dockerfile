# LocalBuddy API. Build from the repository root, so global.json pins the SDK:
#   docker build -f backend/Dockerfile .
# The image also carries the EF migration bundle (/app/efbundle); deploy/demo/compose.yaml runs it
# once, to completion, before the API starts. The API itself never migrates (README, "Applying
# migrations on deploy").

# Pinned like Postgres in docker-compose.yml: the SDK is the one global.json names, the runtime
# the patch Directory.Packages.props builds against.
FROM mcr.microsoft.com/dotnet/sdk:10.0.301 AS build
WORKDIR /src

# Restore first, from the project files alone, so a code change does not re-download packages.
COPY global.json ./
COPY backend/Directory.Build.props backend/Directory.Packages.props backend/
COPY backend/LocalBuddy.Api/LocalBuddy.Api.csproj backend/LocalBuddy.Api/
RUN dotnet restore backend/LocalBuddy.Api/LocalBuddy.Api.csproj

COPY backend/LocalBuddy.Api/ backend/LocalBuddy.Api/
RUN dotnet publish backend/LocalBuddy.Api/LocalBuddy.Api.csproj -c Release -o /out --no-restore

# Same version as Microsoft.EntityFrameworkCore.Design in Directory.Packages.props.
RUN dotnet tool install dotnet-ef --version 10.0.11 --tool-path /tools \
 && /tools/dotnet-ef migrations bundle --project backend/LocalBuddy.Api/LocalBuddy.Api.csproj \
      --configuration Release --output /out/efbundle

FROM mcr.microsoft.com/dotnet/aspnet:10.0.11
WORKDIR /app
COPY --from=build /out .

# The photo volume mounts here. Created in the image, owned by the app user, so a fresh named
# volume starts out writable by it (Docker copies the ownership into an empty volume).
RUN mkdir -p wwwroot/uploads && chown -R "$APP_UID" wwwroot/uploads

# The non-root user every .NET image ships; it listens on 8080 (ASPNETCORE_HTTP_PORTS).
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "LocalBuddy.Api.dll"]
