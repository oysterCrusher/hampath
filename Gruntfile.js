module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        uglify: {
            hamPath: {
                files: {
                    'hampath.min.js' : ['hamPath.js']
                }
            }
        }
    });

};