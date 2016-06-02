
var app = angular.module('loome', ['ngRoute', 'ngCookies']);


// configure our routes
app.config(function($routeProvider, $httpProvider) {
    $routeProvider

        .when('/', {
            templateUrl : '../partials/main.html',
            controller  : 'mainController'
        })

        .when('/map', {
            templateUrl : '../partials/map.html',
            controller  : 'mapController'
        })

        .when('/gender', {
            templateUrl : '../partials/gender.html',
            controller  : 'genderController'
        })

        // route for the about page
        .when('/info', {
            templateUrl : '../partials/info.html',
            controller  : 'infoController'
        })
        .otherwise({redirectTo: function() {
            window.location = "/404.html";
        }
    });

        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller( 'mainController',function($scope, $http, $cookies, $location, $timeout) {

    var url = "http://loome.awesomeads.co.nz/toilets/";

    $scope.toiletData = null;
    $scope.userStatus = null;

    $scope.user = {
        'gender': $cookies.get('gender'),
        'id': $cookies.get('id'),
        'hasSeenMap': $cookies.get('seenMap'),
        'hasSeenInfo': $cookies.get('seenInfo'),
        'inQueues': $cookies.get('inQueues'),
        'subscribedToilets': []
    };

    if($scope.user.inQueues == undefined){
        $scope.user.inQueues = "";
    }

    // Check if user cookie exists, if not create one
    if(!$cookies.get('id')) {
        var hash = Math.random().toString(36).slice(2);
        $cookies.put('id', hash);
        $scope.user.id = hash;
        if($scope.user.id) {
            console.error("Warning: id was not defined");
        }
    }

    followToPage();

    // #####################################################################################
    // Get Toilets
    // #####################################################################################


    // this code checks to see if the user is currently viewing the app.
    // if they are, it slowly increases the poll frew by .5 sec every call
    // if they browse away from the page then go back, it resets to 0
    var reflushInterval = 1000;
    var vis = (function(){
        var stateKey, eventKey, keys = {
            hidden: "visibilitychange",
            webkitHidden: "webkitvisibilitychange",
            mozHidden: "mozvisibilitychange",
            msHidden: "msvisibilitychange"
        };
        for (stateKey in keys) {
            if (stateKey in document) {
                eventKey = keys[stateKey];
                break;
            }
        }
        return function(c) {
            if (c) document.addEventListener(eventKey, c);
            return !document[stateKey];
        }
    })();

    $scope.resetReflush = function() {
        reflushInterval = 1000;
    };

    // bind function to event listener
    vis($scope.resetReflush);

    // poll toilet data
    $scope.reflush = function() {
        $timeout(function() {
            if(true) {
                if(vis()) {
                    $http.get(url + "status?device_id=" + $scope.user.id)
                        .success(function (data) {
                            $scope.toiletData = data.toilets;
                            $scope.userStatus = data.subscriptions;
                            if($scope.userStatus != undefined) {
                                $scope.updateSubscriptions($scope.userStatus);
                            } else {
                                $scope.user.subscribedToilets = [];
                            }
                        })
                        .error(function (data) {
                            console.log('Error: ' + data);
                        });
                }
            }
            $scope.reflush();
        }, reflushInterval);
    };

    $scope.reflush();

    $scope.updateSubscriptions = function(newData) {
        console.log(newData);
        $scope.user.subscribedToilets = [];
        newData.forEach(function(toilet){
            $scope.user.subscribedToilets.push(toilet.toilet_id);
        });
    };


    $scope.genderFilter = function(toilet) {
        var gender = toilet.gender.toLowerCase();
        if(gender == $scope.user.gender || gender == "uni-sex") {
            return true;
        }
        return false;
    };

    // #####################################################################################
    // Join Queue
    // #####################################################################################

    $scope.joinQueue = function(toiletId) {
        $scope.resetReflush();
        $http.get(url + "join_queue?device_id=" + $scope.user.id + "&toilet_id=" + toiletId + "&app_type=Chrome")
            .success(function (data) {
                $scope.user.subscribedToilets.push(toiletId);
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };



    // #####################################################################################
    // Leave Queue
    // #####################################################################################

    $scope.leaveQueue = function(toiletId) {
        $scope.resetReflush();
        $http.get(url + "leave_queue?device_id=" + $scope.user.id + "&toilet_id=" + toiletId + "&app_type=Chrome")
            .success(function (data) {
                var index = $scope.user.subscribedToilets.indexOf(toiletId);
                if (index > -1) {
                    $scope.user.subscribedToilets.splice(index, 1);
                }
                console.log(data);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };





    function followToPage() {
        console.log($scope.user);
        if($scope.user.gender == undefined) {
            $location.path('/gender').replace();
        } else if($scope.user.hasSeenMap == undefined) {
            $location.path('/map').replace();
        } else if ($scope.user.hasSeenInfo == undefined) {
            $location.path('/info').replace();
        } else {
            $location.path('/').replace();
        }
    }

});

app.controller('mapController', function($scope, $cookies, $location) {
    // create a message to display in our view
    $scope.message = 'a map!';


    $scope.closeMap = function() {
        $cookies.put('seenMap', 'true');
        $scope.user.hasSeenMap = "true";
        if($scope.user.hasSeenMap == undefined) {
            console.error("Warning: hasSeenMap was not defined");
        }
        console.log("clicked");
        followToPage();
    };

    function followToPage() {
        console.log($scope.user);
        if($scope.user.gender == undefined) {
            $location.path('/gender').replace();
        } else if($scope.user.hasSeenMap == undefined) {
            $location.path('/map').replace();
        } else if ($scope.user.hasSeenInfo == undefined) {
            $location.path('/info').replace();
        } else {
            $location.path('/').replace();
        }
    }
});

app.controller('genderController', function($scope, $rootScope, $cookies, $location) {

    $scope.changeUserMale = function() {
         $cookies.put('gender', 'male');
         $scope.user.gender = "male";
         if($scope.user.gender == undefined) {
             console.error("Warning: gender was not defined");
         }
         followToPage();
    };

    $scope.changeUserFemale = function() {
        $cookies.put('gender', 'female');
        $scope.user.gender = "female";
        if($scope.user.gender == undefined) {
            console.error("Warning: gender was not defined");
        }
        followToPage();
    };


    function followToPage() {
        console.log($scope.user);
        if($scope.user.gender == undefined) {
            $location.path('/gender').replace();
        } else if($scope.user.hasSeenMap == undefined) {
            $location.path('/map').replace();
        } else if ($scope.user.hasSeenInfo == undefined) {
            $location.path('/info').replace();
        } else {
            $location.path('/').replace();
        }
    }
});

app.controller('infoController', function($scope, $cookies, $location) {
    $scope.quitInfo = function() {
        $cookies.put('seenInfo', 'true');
        $scope.user.hasSeenInfo = "true";
        if($scope.user.gender == undefined) {
            console.error("Warning: gender was not defined");
        }
        followToPage();
    };



    function followToPage() {
        console.log($scope.user);
        if($scope.user.gender == undefined) {
            $location.path('/gender').replace();
        } else if($scope.user.hasSeenMap == undefined) {
            $location.path('/map').replace();
        } else if ($scope.user.hasSeenInfo == undefined) {
            $location.path('/info').replace();
        } else {
            $location.path('/').replace();
        }
    }
});