angular.module('wras-player.controllers', [])
// stream of album 88 factory
.factory( 'stream88', [ '$rootScope', '$q', '$http', '$ionicLoading', function( $rootScope, $q, $http, $ionicLoading ) {

  var stream;
  // defer a call to the stream information
  var loadStream = function(){
    var streamDeferred = $q.defer();
    $ionicLoading.show({
      template: 'Loading Stream...'
    });
    $http.get('http://www.publicbroadcasting.net/wras/ppr/wras2.m3u')
    .success(function ( data, status ) {
      streamDeferred.resolve( data );
    }).error(function ( data, status ) {
      streamDeferred.resolve( data );
    });
    var handleStream = streamDeferred.promise;
    // handle the resolved stream information
    handleStream.then( function( data, status ) {
      var streamUrl = parseStreamURL( data );
      stream = new Audio();
      stream.addEventListener( 'canplay', handleLoad );
      stream.src = streamUrl;
      stream.load();
      // set up our event listeners
    });
  };

  var pauseStream = function() {
    stream.pause();
    $rootScope.$broadcast('streamPaused');
  };
  var playStream = function() {
    stream.play();
    $rootScope.$broadcast('streamPlaying');
  };
  var refreshStream = function() {
    $ionicLoading.show({
      template: 'Loading Stream...'
    });
    stream.pause();
    stream = null;
    loadStream();
    $rootScope.$broadcast('streamPaused');
  };
  // handlers for stream events
  var handleLoad = function() {
    $rootScope.showControls = true;
    $ionicLoading.hide();
    playStream();
  };

  var parseStreamURL = function( msg ) {
    var lines = msg.split("\n");
    for ( var i=0;i<lines.length;i++){
      if ( lines[i].indexOf('http://') > -1 ) {
        var streamUrl = lines[i];
        return streamUrl;
      }
    }
  };

  // INIT
  $rootScope.showControls = false;
  (function(){
    loadStream();
  })();

  // return interface
  return {
    play          : playStream,
    pause         : pauseStream,
    refresh       : refreshStream
  };

}])
// Player view controller
.controller('PlayerCtrl', [ '$scope', 'stream88', function( $scope, stream88 ) {

  // INIT
  var disabledStyle = {'background-color': '#444'};
  var activeStyle   = {'background-color': '#262626'};

  $scope.playStream = function() {
    if ( $scope.isPlaying ) return;
    stream88.play();
  };
  $scope.pauseStream = function() {
    if ( !$scope.isPlaying ) return;
    stream88.pause();
  };
  $scope.refreshStream = function() {
    stream88.refresh();
  };

  $scope.$on( 'streamPaused', function() {
    $scope.isPlaying = false;
    $scope.playStyle = disabledStyle;
    $scope.pauseStyle = activeStyle;
  });

  $scope.$on( 'streamPlaying', function() {
    $scope.isPlaying  = true;
    $scope.playStyle  = activeStyle;
    $scope.pauseStyle = disabledStyle;
  });

}])
;