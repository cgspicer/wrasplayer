angular.module('wras-player.controllers', [])
// stream of album 88 factory
.factory( 'stream88', [ '$rootScope', '$q', '$http', '$ionicLoading', '$timeout', '$ionicModal', function( $rootScope, $q, $http, $ionicLoading, $timeout, $ionicModal ) {

  var stream
      waitingForStream = false,
      isFirstStall = true;
  // set up a modal for displaying connectivity errors
  $ionicModal.fromTemplateUrl('connection-error.html', {
    scope: $rootScope,
    animation: 'slide-in-down'
  }).then(function(modal) {
    $rootScope.connectionWarning = modal;
  });

  // defer a call to the stream information
  var loadStream = function()
  {
    streamUrl = 'http://17003.live.streamtheworld.com:80/WRASFM_SC';
    stream = new Audio();
    stream.addEventListener( 'loadstart', handleLoad );
    stream.addEventListener( 'stalled', handleStalled );
    stream.addEventListener( 'error', handleError );
    stream.src = streamUrl;
    stream.load();
  };
  var pauseStream = function()
  {
    stream.pause();
    $rootScope.$broadcast('streamPaused');
  };
  var playStream = function()
  {
    stream.play();
    $rootScope.$broadcast('streamPlaying');
  };
  var refreshStream = function()
  {
    $ionicLoading.show({
      template: 'Loading Stream...'
    });
    stream.pause();
    stream = null;
    loadStream();
    $rootScope.$broadcast('streamPaused');
  };
  // handlers for stream events
  var handleLoad = function()
  {
    $rootScope.showControls = true;
    $ionicLoading.hide();
    playStream();
  };
  var handleStalled = function()
  {
    if ( isFirstStall ) {
      isFirstStall = false;
      return false;
    }
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
  var handleError = function()
  {
    $ionicLoading.hide();
    showConnectionWarning();
  };

  // helper functions
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
    TweenMax.to( '.glow', 2.5, { scale: 1, autoAlpha: .1 } );
  });

  $scope.$on( 'streamPlaying', function() {
    $scope.isPlaying  = true;
    $scope.playStyle  = activeStyle;
    $scope.pauseStyle = disabledStyle;
    TweenMax.to( '.glow', 2.5, { scale: 23, autoAlpha: 1 } );
  });

}])
;