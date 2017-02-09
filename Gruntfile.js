module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'builds/<%= grunt.template.today("m-d-yy") %>/build/scripts/loader.js': ['./scripts/loader.js'],
		      'builds/<%= grunt.template.today("m-d-yy") %>/build/scripts/book.js': ['./scripts/book.js'],
          'builds/<%= grunt.template.today("m-d-yy") %>/build/scripts/soundjs-0.6.2.min.js': ['./scripts/soundjs-0.6.2.min.js'],
        }
      }
    },

  copy: {
    main: {
      files: [
        // includes files within path
        {
          expand: true, 
          src: ['index.html'], 
          dest: 'builds/<%= grunt.template.today("m-d-yy") %>/build/'
        },
        {
          expand: true, 
          src: ['index.html'], 
          dest: 'builds/<%= grunt.template.today("m-d-yy") %>/src/'
        },
        {
          expand: true, 
          src: ['./scripts/*'], 
          dest: 'builds/<%= grunt.template.today("m-d-yy") %>/src/'
        },
      ]
    }
  }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['uglify','copy']);
};