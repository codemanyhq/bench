#!/usr/bin/env bash
# The measured `build` step (2026-10-30), run inside ./src.
# Each line is the project's OWN CI build command (source named on the right).
# Extra flags only point caches at $BENCH_CACHE (see env.sh); nothing else is changed.
set -euo pipefail

case "$BENCH_PROJECT" in
  ripgrep)    cargo build --release ;;                                  # ripgrep ci.yml / README
  hugo)       go install ;;                                             # hugo test.yml
  react-dev)  yarn install --frozen-lockfile                            # react.dev analyze.yml
              ./node_modules/.bin/next build ;;
  excalidraw) bash "$BENCH_SCRIPTS/docker-build.sh" excalidraw ;;       # build-docker.yml
  swiftlint)  swift build --configuration release -Xlinker -dead_strip \
                --product swiftlint \
                --scratch-path "$BENCH_CACHE/build" \
                --cache-path "$BENCH_CACHE/swiftpm" ;;                  # SwiftLint Makefile
  typescript) npm ci                                                    # TypeScript ci.yml:27-28
              npx hereby build ;;
  ruff)       cargo build --release --locked --bin ruff ;;              # ruff build-binaries.yml:330
  django)     python -m venv "$RUNNER_TEMP/venv-django"                 # django tests.yml:72-77
              . "$RUNNER_TEMP/venv-django/bin/activate"
              python -m pip install --upgrade pip wheel
              python -m pip install -r tests/requirements/py3-free-threading.txt -e .
              python -Wall tests/runtests.py -v2 ;;
  kubernetes) make WHAT=cmd/kubectl ;;                                  # build/root/Makefile:96-97
  firefox-ios) ./bootstrap.sh firefox                                   # firefox-ios bitrise.yml:78-79
              cd firefox-ios
              xcodebuild -resolvePackageDependencies -onlyUsePackageVersionsFromResolvedFile \
                -project Client.xcodeproj -scheme Fennec -clonedSourcePackagesDirPath "$BENCH_CACHE/spm"
              xcodebuild -project Client.xcodeproj -scheme Fennec -configuration Debug \
                -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build-for-testing \
                COMPILER_INDEX_STORE_ENABLE=NO CODE_SIGN_IDENTITY= CODE_SIGNING_REQUIRED=NO \
                CODE_SIGNING_ALLOWED=NO ARCHS=arm64 -derivedDataPath "$BENCH_CACHE/DerivedData" \
                -clonedSourcePackagesDirPath "$BENCH_CACHE/spm" -skipMacroValidation \
                -skipPackagePluginValidation ;;
  tca)        xcodebuild test -configuration Debug -scheme ComposableArchitecture \
                -workspace .github/package.xcworkspace -destination platform=macOS \
                -derivedDataPath "$BENCH_CACHE/DerivedData" \
                -clonedSourcePackagesDirPath "$BENCH_CACHE/spm" -skipMacroValidation ;;  # TCA ci.yml:47
  nowinandroid) mkdir -p "$GRADLE_USER_HOME"                            # nowinandroid Build.yaml:31,137
              cp .github/ci-gradle.properties "$GRADLE_USER_HOME/gradle.properties"
              ./gradlew :app:assemble -PminifyWithR8=false ;;
  neovim)     cmake -S cmake.deps --preset ci -B "$DEPS_BUILD_DIR" -D CMAKE_BUILD_TYPE=Debug  # neovim test.yml:210-218
              cmake --build "$DEPS_BUILD_DIR"
              cmake --preset ci -D CMAKE_BUILD_TYPE=Release   # translations off on both sides: no gettext without sudo
              cmake --build build ;;
  *) echo "::error::no build command for '$BENCH_PROJECT'"; exit 1 ;;
esac
