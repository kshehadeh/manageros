# Changelog

## [1.8.6](https://github.com/kshehadeh/manageros/compare/v1.8.5...v1.8.6) (2025-11-24)

### Bug Fixes

- **build:** Fix build error ([fb9918e](https://github.com/kshehadeh/manageros/commit/fb9918e8b0cff1eba024f0fbe960505a1ec02c2d))
- **clerk:** Reduce the number of times we call Clerk apis ([affb85e](https://github.com/kshehadeh/manageros/commit/affb85e290891a4e3245d6845b1a9b69a6792a91))
- **forms:** Forms were not properly using NextjS redirects ([7d2449b](https://github.com/kshehadeh/manageros/commit/7d2449be0c912a5137bc179a1e91810d740167e7))
- **ui:** Team detail view loading page didn't look right anymore ([e52287c](https://github.com/kshehadeh/manageros/commit/e52287cb3eff8ba5fc79326d903b531aa65effc6))

## [1.8.5](https://github.com/kshehadeh/manageros/compare/v1.8.4...v1.8.5) (2025-11-24)

### Bug Fixes

- **build:** Fix build error ([0c1ac8b](https://github.com/kshehadeh/manageros/commit/0c1ac8b8ce422ff2740bcce82801fba556a17c99))
- **various:** Fixed various UI issues and put organization settings in the sidebar ([da27262](https://github.com/kshehadeh/manageros/commit/da27262242a9f083d06c6aadebd7a07f41684a11))

## [1.8.4](https://github.com/kshehadeh/manageros/compare/v1.8.3...v1.8.4) (2025-11-23)

## [1.8.3](https://github.com/kshehadeh/manageros/compare/v1.8.2...v1.8.3) (2025-11-23)

### Bug Fixes

- **build:** Build error fixed ([30f68ff](https://github.com/kshehadeh/manageros/commit/30f68ffdb3843e8a7efcd6de6d2af37a84e8155f))
- **ui:** Badge removal for role ([a499385](https://github.com/kshehadeh/manageros/commit/a49938555522dd1fb96c5fdbb55afa5b354d080c))
- **users:** Manage users UI changes ([aa622dd](https://github.com/kshehadeh/manageros/commit/aa622dd3355ea86d84836b93a33216f057f4de4d))

## [1.8.2](https://github.com/kshehadeh/manageros/compare/v1.8.1...v1.8.2) (2025-11-22)

### Bug Fixes

- **organizations:** More cleanup of organizations to put more of the control in the hands of the clerk api and UI ([156b3d4](https://github.com/kshehadeh/manageros/commit/156b3d47e6e9539b645ee3b4649287cc2f7c57ad))
- **ui:** Added better dashboard skeletons ([d2a90c3](https://github.com/kshehadeh/manageros/commit/d2a90c3602b58a0c895192d3e6a877c35105c091))
- **ui:** update person detail modal ([619b7bd](https://github.com/kshehadeh/manageros/commit/619b7bd8d67bb53c80ea3e062df42bab9b7547f7))

## [1.8.1](https://github.com/kshehadeh/manageros/compare/v1.8.0...v1.8.1) (2025-11-22)

### Bug Fixes

- **ui:** Various UI fixes ([a46cb4f](https://github.com/kshehadeh/manageros/commit/a46cb4f54a156cdd18aca3ce25cee195fde0a655))

# [1.8.0](https://github.com/kshehadeh/manageros/compare/v1.7.2...v1.8.0) (2025-11-21)

### Bug Fixes

- **build:** Fix build error ([480366a](https://github.com/kshehadeh/manageros/commit/480366ab372df450bb2a0568e4a2897d50ecb33d))
- **permissions:** Made it impossible to see other org tasks and oneonones ([bcb01a2](https://github.com/kshehadeh/manageros/commit/bcb01a25489afc75d965b82c0b28ed12bfaa5672))

### Features

- **organizations:** Use the clerk ui for organization management ([71661d0](https://github.com/kshehadeh/manageros/commit/71661d09b626aa282e5c404283e20c55c9d65355))

## [1.7.2](https://github.com/kshehadeh/manageros/compare/v1.7.1...v1.7.2) (2025-11-20)

### Bug Fixes

- **subscriptions:** Removed plan limits again ([b6e9dfa](https://github.com/kshehadeh/manageros/commit/b6e9dfa3a7c759a95d01ab979582c8221837d92a))

## [1.7.1](https://github.com/kshehadeh/manageros/compare/v1.7.0...v1.7.1) (2025-11-20)

### Bug Fixes

- **subscriptions:** Removed plan limits ([727e37e](https://github.com/kshehadeh/manageros/commit/727e37ee8b3169375b8634112196da61817999cb))

# [1.7.0](https://github.com/kshehadeh/manageros/compare/v1.6.1...v1.7.0) (2025-11-19)

### Bug Fixes

- **api:** Remove unnecessary calls to pull current user from an api instead of using the current session ([312881d](https://github.com/kshehadeh/manageros/commit/312881d91cae5fbcfd7a5899729772f0492df0b4))
- **lists:** Fixed a problem with the view dropdown not working ([65d9060](https://github.com/kshehadeh/manageros/commit/65d90603442b54ef15e36aa76ff27adb9a27c764))

### Features

- **onboarding:** Work to handle organization onboarding and org switching through clerk (wip) ([208949a](https://github.com/kshehadeh/manageros/commit/208949a40e2a856a7bd00a430caf56a16e369488))

## [1.6.1](https://github.com/kshehadeh/manageros/compare/v1.6.0...v1.6.1) (2025-11-17)

### Bug Fixes

- **organization:** Problems with organization/user association after big change ([74734c6](https://github.com/kshehadeh/manageros/commit/74734c6dea40572dd90bd3295960e67a0a3ae4d0))

# [1.6.0](https://github.com/kshehadeh/manageros/compare/v1.5.1...v1.6.0) (2025-11-17)

### Bug Fixes

- **cicd:** Fix an issue with environment variables in the migration deployment action ([c8dc023](https://github.com/kshehadeh/manageros/commit/c8dc02375f261c702c5a41917c38b68a010a8817))
- **linking:** Do not throw an error when fetching linkable users ([9907dee](https://github.com/kshehadeh/manageros/commit/9907dee5032f771d4efeff169bbf0f2fb9a76398))
- **organizations:** Fixed an issue with the handling of organization creation when there's no subscription ([c0588b6](https://github.com/kshehadeh/manageros/commit/c0588b6ec792e8399ea8bb82e123c1e3f17f1e42))

### Features

- **organizaitons:** Complete rework of the way organizations, subscriptions and users are tracked. Still a work in progress ([49713e8](https://github.com/kshehadeh/manageros/commit/49713e8745936b4c2a164597a28baf1554e204f1))

## [1.5.1](https://github.com/kshehadeh/manageros/compare/v1.5.0...v1.5.1) (2025-11-15)

### Bug Fixes

- **security:** Issue with the way that we fetch subscription information ([96d6993](https://github.com/kshehadeh/manageros/commit/96d6993a74170a0da9c2cf9ce47845c7ef908662))

# [1.5.0](https://github.com/kshehadeh/manageros/compare/v1.4.0...v1.5.0) (2025-11-15)

### Features

- **subscriptions:** Added support for subscriptions and improved the permissions system ([5aaf0de](https://github.com/kshehadeh/manageros/commit/5aaf0de00e36cd62270aa157ec67418362f8f828))

# [1.4.0](https://github.com/kshehadeh/manageros/compare/v1.3.0...v1.4.0) (2025-11-13)

### Bug Fixes

- **dates:** Fixed an issue where users couldn't select a future date ([eedb5e8](https://github.com/kshehadeh/manageros/commit/eedb5e81c6823920c08d11cc9165fb0cfd99e664))
- **feedback:** Delete confirmation for feedback campaign was not working properly ([eb6ceda](https://github.com/kshehadeh/manageros/commit/eb6ceda608d5afd0d2e5a5e15b36975b439e9baf))

### Features

- **billing:** Added support for ownership role and setup new flow for onboarding ([4cc576d](https://github.com/kshehadeh/manageros/commit/4cc576d76a6c4270535c859bc132c998c438de7d))

# [1.3.0](https://github.com/kshehadeh/manageros/compare/v1.2.4...v1.3.0) (2025-11-12)

### Bug Fixes

- **organizations:** Reset legacy fields after removal from organization ([dd55b8c](https://github.com/kshehadeh/manageros/commit/dd55b8c6734c14f5969ac6944e1bb95338250f75))

### Features

- **organizaitons:** Change the way that we associate permissions with orgs and users ([9c3205d](https://github.com/kshehadeh/manageros/commit/9c3205d7017a44ab673550219473d20b84e1ccbf))

## [1.2.4](https://github.com/kshehadeh/manageros/compare/v1.2.3...v1.2.4) (2025-11-11)

### Bug Fixes

- **cicd:** Fixed an issue with the way that gha handles waiting for deploy ([6ca342e](https://github.com/kshehadeh/manageros/commit/6ca342e39c7dd26bbc4165ea8ceebf51112b19f3))
- **cmdpalette:** Fixed an issue with sizing ([4c5be29](https://github.com/kshehadeh/manageros/commit/4c5be29b3eea733ac62fa3bec0bd82f718feaad5))
- **ui:** Use theme tokens for spacing - part 1 ([494a0c7](https://github.com/kshehadeh/manageros/commit/494a0c74ec3b7529cfa0b018fb3cd1bec5acd09e))
- **ui:** Use theme tokens for spacing - part 2 ([fdcdecf](https://github.com/kshehadeh/manageros/commit/fdcdecf1294f8087aa57d3737904fb2238df555f))

## [1.2.3](https://github.com/kshehadeh/manageros/compare/v1.2.2...v1.2.3) (2025-11-11)

## [1.2.2](https://github.com/kshehadeh/manageros/compare/v1.2.1...v1.2.2) (2025-11-11)

## [1.2.1](https://github.com/kshehadeh/manageros/compare/v1.2.0...v1.2.1) (2025-11-10)

# [1.2.0](https://github.com/kshehadeh/manageros/compare/v1.1.4...v1.2.0) (2025-11-10)

### Bug Fixes

- Fixed a problem with the way that release-it was being run ([64e23ee](https://github.com/kshehadeh/manageros/commit/64e23ee02fd03b6fae7f01dc06264cc2fd6db11c))

### Features

- Support conventional commits ([d21431c](https://github.com/kshehadeh/manageros/commit/d21431c19e7905aa7e91530ed2a2bfe93f78d93c))
