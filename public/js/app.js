var app = angular.module('FinancingCircle', []).config(function($interpolateProvider){
    $interpolateProvider.startSymbol('{?').endSymbol('?}');
});

app.controller('inviteFriendController', function($scope, $http){
  $scope.sendInvitation = function(data){
    $scope.message = "sending ..."
  	var _csrf = $("#_csrf").val();
  	data = (data != undefined) ? angular.extend(data, {_csrf: _csrf}) : {_csrf: _csrf}
    $http.post('/friends/invite', data).success(function(response) {
      $scope.message = response.message
    });
  };
});
