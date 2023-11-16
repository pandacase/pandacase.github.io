// $(function() {
//     var $searchIcon = $('.search-icon');
//     var $searchBox = $('<div class="search-box"><form><input type="text" placeholder="Search"></form></div>');
//     var $searchInput = $searchBox.find('input[type="text"]');
//     var $searchResults = $('<div class="search-results"></div>');
//     var $body = $('body');
  
//     $searchIcon.after($searchBox);
  
//     $searchInput.on('input', function() {
//       var query = $(this).val().toLowerCase();
//       var results = [];
  
//       if (query) {
//         $('article').each(function() {
//           var $article = $(this);
//           var title = $article.find('.post-title').text().toLowerCase();
//           var content = $article.find('.post-content').text().toLowerCase();
  
//           if (title.indexOf(query) !== -1 || content.indexOf(query) !== -1) {
//             results.push({
//               title: title,
//               content: content,
//               url: $article.find('a').attr('href')
//             });
//           }
//         });
//       }
  
//       displaySearchResults(results);
//     });
  
//     function displaySearchResults(results) {
//       $searchResults.empty();
  
//       if (results.length) {
//         results.forEach(function(result) {
//           var $result = $('<div><a href="' + result.url + '">' + result.title + '</a></div>');
//           $searchResults.append($result);
//         });
//       } else {
//         $searchResults.html('<p>No results found.</p>');
//       }
  
//       $searchResults.appendTo($body).show();
//     }
  
//     $searchBox.on('submit', function(event) {
//       event.preventDefault();
//       $searchInput.trigger('input');
//     });
  
//     $searchIcon.on('click', function(event) {
//       event.preventDefault();
//       $searchBox.toggle();
//       $searchInput.focus();
//     });
  
//     $(document).on('click', function(event) {
//         if (!$(event.target).closest('.search-box, .search-icon').length) {
//             $searchBox.hide();
//             $searchResults.hide();
//         } 
//     });
//   });