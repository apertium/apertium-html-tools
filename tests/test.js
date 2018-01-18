/* global QUnit, config, modeEnabled */

QUnit.module('Change mode');
QUnit.test('Mode test', function (assert) {
    assert.expect(4); // eslint-disable-line no-magic-numbers
    $('a[data-mode="sandbox"]').click();
    assert.equal($('#sandboxContainer').css('display'), 'block', 'Switching to sandbox mode');
    $('a[data-mode="translation"]').click();
    assert.equal($('#translationContainer').css('display'), 'block', 'Switching to translation mode');
    $('a[data-mode="analyzation"]').click();
    assert.equal($('#analyzationContainer').css('display'), 'block', 'Switching to analyzation mode');
    $('a[data-mode="generation"]').click();
    assert.equal($('#generationContainer').css('display'), 'block', 'Switching to generation mode');
});

QUnit.module('Verify modeEnabled is consistent with config file');
QUnit.test('Check modeEnabled', function (assert) {
    assert.expect(4); // eslint-disable-line no-magic-numbers
    assert.equal(config.ENABLED_MODES.includes('translation'), modeEnabled('translation'), 'Translation mode is consistent');
    assert.equal(config.ENABLED_MODES.includes('generation'), modeEnabled('generation'), 'Generation mode is consistent');
    assert.equal(config.ENABLED_MODES.includes('analyzation'), modeEnabled('analyzation'), 'Analyzation mode is consistent');
    assert.equal(config.ENABLED_MODES.includes('sandbox'), modeEnabled('sandbox'), 'Sandbox mode is consistent');
});
