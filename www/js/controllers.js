angular.module('wras-player.controllers', [])
// stream of album 88 factory
.factory( 'stream88', [ '$rootScope', '$q', '$http', '$ionicLoading', '$timeout', '$ionicModal', function( $rootScope, $q, $http, $ionicLoading, $timeout, $ionicModal ) {

  var stream;
  var waitingForStream = false;
  // set up a modal for displaying connectivity errors
  $ionicModal.fromTemplateUrl('connection-error.html', {
    scope: $rootScope,
    animation: 'slide-in-down'
  }).then(function(modal) {
    $rootScope.connectionWarning = modal;
  });

  // defer a call to the stream information
  var loadStream = function(){
    var streamDeferred = $q.defer();
    $ionicLoading.show({
      template: 'Loading Stream...'
    });
    $http.get('http://www.publicbroadcasting.net/wras/ppr/wras2.m3u')
    .success(function ( data ) {
      streamDeferred.resolve( data );
    }).error(function ( data ) {
      $ionicLoading.hide();
      showConnectionWarning();
    });
    var handleStream = streamDeferred.promise;
    // handle the resolved stream information
    handleStream.then( function( data ) {
      if ( status === 'error' ) {
        $ionicLoading.hide();
        showConnectionWarning();
        return false;
      }
      var streamUrl = parseStreamURL( data );
      stream = new Audio();
      stream.addEventListener( 'canplay', handleLoad );
      stream.addEventListener( 'stalled', handleStalled );
      stream.addEventListener( 'error', handleError );
      stream.src = streamUrl;
      stream.load();
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
  var handleStalled = function() {
    // handler for when the stream resumes itself
    var streamResumed = function() {
      waitingForStream = false;
      stream.removeEventListener( 'progress', streamResumed, false );
      // stream has resumed, so let's reset state
      $ionicLoading.hide();
      $rootScope.$broadcast('streamPlaying');
    }

    // set the state to paused
    waitingForStream = true;
    $ionicLoading.show({
      template: 'Waiting for Stream...'
    });
    // set up a fail safe for 30 seconds
    $timeout( function() {
      if ( waitingForStream ) {
        stream.removeEventListener( 'progress', streamResumed, false );
        // stream is taking too long to load on its own, refresh it
        $ionicLoading.hide();
        stream.pause();
        showConnectionWarning();
      } else {
        // do nothing
      }
    }, 30000);
    $rootScope.$broadcast('streamPaused');
    stream.addEventListener( 'progress', streamResumed );

  };
  var handleError = function() {
    $ionicLoading.hide();
    showConnectionWarning();
  };

  // helper functions
  var parseStreamURL = function( msg ) {
    var lines = msg.split("\n");
    for ( var i=0;i<lines.length;i++){
      if ( lines[i].indexOf('http://') > -1 ) {
        var streamUrl = lines[i];
        return streamUrl;
      }
    }
  };
  var showConnectionWarning = function() {
    $rootScope.connectionWarning.show();
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