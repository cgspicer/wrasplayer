angular.module('wras-player.controllers', [])

.controller('PlayerCtrl', function($scope, $http, $ionicLoading) {
  $ionicLoading.show({
    template: 'Loading...'
  });
  var stream;
  var disabledStyle = {'background-color': '#444'};
  var activeStyle = {'background-color': '#262626'};
  var checkM3uPlaylist = function() {
    $http.get('http://www.publicbroadcasting.net/wras/ppr/wras2.m3u')
    .success(function (data, status, headers, config) {
      var lines = data.split("\n");
      for ( var i=0;i<lines.length;i++){
        if ( lines[i].indexOf('http://') > -1 ) {
          var streamUrl = lines[i];
          stream = new Audio();
          stream.src = streamUrl;
          stream.load();
          $scope.playStyle = activeStyle;
          $scope.pauseStyle = disabledStyle;
          $scope.isPlaying = true;
          setTimeout( function(){
              $ionicLoading.hide();
              $scope.showControls = true;
            }, 1500);
        }
      }

    }).error(function (data, status, headers, config) {
      // console.log(status);
    });
  }
  $scope.pauseStream = function() {
    try { stream.pause(); } catch(err) { }
    $scope.isPlaying = false;
    $scope.playStyle = disabledStyle;
    $scope.pauseStyle = activeStyle;
  }
  $scope.playStream = function() {
    try { stream.play(); } catch(err) { }
    $scope.isPlaying = true;
    $scope.playStyle = activeStyle;
    $scope.pauseStyle = disabledStyle;
  }
  $scope.refreshStream = function() {
    $scope.playStyle = disabledStyle;
    $scope.pauseStyle = disabledStyle;
    try { stream.pause(); } catch(err) { }
    $scope.isPlaying = false;
    $ionicLoading.show({
      template: 'Loading...'
    });
    checkM3uPlaylist();
  }
  $scope.refreshStream();
});