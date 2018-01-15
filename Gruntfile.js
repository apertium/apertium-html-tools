module.exports = function(grunt) {
    grunt.initConfig({
        qunit: {
            all: 'build/qunit-test.html'
        }
    });
    grunt.loadNpmTasks('grunt-contrib-qunit');
};
