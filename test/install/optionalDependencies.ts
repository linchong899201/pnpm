import tape = require('tape')
import promisifyTape from 'tape-promise'
import {install, installPkgs} from '../../src'
import {
  prepare,
  addDistTag,
  testDefaults,
  pathToLocalPkg,
  local,
  execPnpmSync,
} from '../utils'

const test = promisifyTape(tape)

test('successfully install optional dependency with subdependencies', async function (t) {
  const project = prepare(t)

  await installPkgs(['fsevents@1.0.14'], testDefaults({saveOptional: true}))
})

test('skip failing optional dependencies', async function (t) {
  const project = prepare(t)
  await installPkgs(['pkg-with-failing-optional-dependency@1.0.1'], testDefaults())

  const isNegative = project.requireModule('pkg-with-failing-optional-dependency')
  t.ok(isNegative(-1), 'package with failed optional dependency has the dependencies installed correctly')
})

test('skip optional dependency that does not support the current OS', async function (t) {
  const project = prepare(t, {
    optionalDependencies: {
      'not-compatible-with-any-os': '*'
    }
  })
  await install(testDefaults())

  await project.hasNot('not-compatible-with-any-os')
  await project.storeHasNot('not-compatible-with-any-os', '1.0.0')

  const shr = await project.loadShrinkwrap()
  t.ok(shr.packages['/not-compatible-with-any-os/1.0.0'], 'shrinkwrap contains optional dependency')
})

test('skip optional dependency that does not support the current Node version', async function (t) {
  const project = prepare(t, {
    optionalDependencies: {
      'for-legacy-node': '*'
    }
  })

  await install(testDefaults())

  await project.hasNot('for-legacy-node')
  await project.storeHasNot('for-legacy-node', '1.0.0')
})

test('skip optional dependency that does not support the current pnpm version', async function (t) {
  const project = prepare(t, {
    optionalDependencies: {
      'for-legacy-pnpm': '*'
    }
  })

  await install(testDefaults())

  await project.hasNot('for-legacy-pnpm')
  await project.storeHasNot('for-legacy-pnpm', '1.0.0')
})

test('don\'t skip optional dependency that does not support the current OS when forcing', async function (t) {
  const project = prepare(t, {
    optionalDependencies: {
      'not-compatible-with-any-os': '*'
    }
  })

  await install(testDefaults({
    force: true
  }))

  await project.has('not-compatible-with-any-os')
  await project.storeHas('not-compatible-with-any-os', '1.0.0')
})
