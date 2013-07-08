module.exports = function(grunt) {

  grunt.initConfig({
    less: {
      production: {
        options: {
          yuicompress: true,
          report: 'gzip'
        },
        files: {
          "public/css/style.css": "server/stylesheets/style.less"
        }
      }
    }
  });


  // Load the plugin that provides the "less" task.
  grunt.loadNpmTasks('grunt-contrib-less');

  // Default task(s).
  grunt.registerTask('default', ['less']);
};