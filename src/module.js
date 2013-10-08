'use strict';

/**
 * restmod
 *
 * Usage - Model Definition:
 *
 *  module('module'.factory('PagedModel', ['$restModel', function($restModel) {
 *    return $restmodFactory()
 *      .on('before_collection_fetch', function() {
 *      });
 *      .classDefine('nextPage', function() {
 *      });
 *  }]));
 *
 *  module('module').factory('Book', ['$restModel', 'Author', Chapter', function($restModel, Author, Chapter) {
 *    return $restModel('api/books', {
 *      name: { primary: true },
 *      seen: { def: false, ignore: true },
 *      createdAt: { parse: 'railsDate' },
 *      chapters: { hasMany: Chapter },
 *      author: { hasOne: Author }
 *    }, function(_builder) {
 *      _builder.parse(function(_rawData, _localData) {
 *
 *      });
 *      _builder.render(function(_localData, _toData) {
 *
 *      });
 *      _builder.before_create(function() {
 *        // Do something with book before persisting!
 *        });
 *    }, PagedModel);
 *  }]);
 *
 * Usage - Services/Controllers:
 *
 *  module('module').service('Library', ['Author', 'Book', function(Book) {
 *
 *    ...
 *
 *    // Get all books with more than 100 pages
 *    books = Book.$search({ minPages: 100 })
 *
 *    // Get all chapters that belong to the Book with name 'angular-for-dummies'
 *    chapters = Author.mock('angular-for-dummies').chapters().fetch();
 *
 *    // Add a chapter to the same book
 *    chapter = Book.mock('angular-for-dummies').chapters().create({ title: 'Angular And IE7', pages: 30 });
 *
 *    // Modify a book's author (without fetching data)
 *    Book.mock('angular-for-dummies').author().update({ name: 'A. Dummy' });
 *
 *    // Modify a loaded book
 *    book.rating = 3;
 *    book.$save();
 *
 *    ...
 *
 *  }]);
 *
 */

angular.module('plRestmod', ['ng']);

