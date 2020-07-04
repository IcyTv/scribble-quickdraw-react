const { override, addBabelPlugin, enableEslintTypescript, useEslintRc } = require('customize-cra');

module.export = override(addBabelPlugin(['@babel/plugin-proposal-class-properties', { loose: true }]), useEslintRc());
