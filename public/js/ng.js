'use strict';
var app = angular.module('app', ['ui.bootstrap', 'angularFileUpload']);


app.config(function($httpProvider){
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller('objCtrl', function($scope, $http, $timeout, $upload) {
  var ctrl = this;

  //dummy object for input
  ctrl.input = {};

    //list of structres
    ctrl.structures = [];
    //list of protein meshes
    ctrl.proteins = {};

    //list of surfaces
    ctrl.surfaces = [];
    //list of surf meshes
    ctrl.surfs = {};

    //object for progress feedback
    ctrl.progress = {started: false, value: 0, delay: 1000, inc: 20};
    ctrl.progress.increment = function() {
        var value = this.value;
        var inc = this.inc;
        $timeout(function(){
            value+= inc;
        }, this.delay);
    }
    /* reset ctrl.input */
    ctrl.input.reset = function () {
        ctrl.input.name = '';
    }
    //welcome message
    ctrl.welcomeMessage = "<- Enter a protein's name and click Go! to get started!";

  //url for server to fetch information
  //var serverUrl = 'http://localhost:5000/';
  var serverUrl = 'http://vasp-api.herokuapp.com/';

  //objects recevied from Bark
  ctrl.barkObjects = [];

  //current objects
  ctrl.objects = {
    names:[],
    counter:0
  };

    //an array of colors for proteins
    ctrl.colors = ['red', 'blue', 'green', 'yellow', 'black'];
    ctrl.colorIndex = 0;

    //set color for protein
    ctrl.setColor = function (index) {
        ctrl.input.color = ctrl.colors[index];
        ctrl.proteinStyle = {'background-color' : ctrl.input.color};
    }
 //offset in children array to get to objects
 ctrl.offset = 2;

    //check for empty color, default to red
    if(!ctrl.input.color) {
        console.log('No color, default to red');
        ctrl.setColor(ctrl.colorIndex++);
    }

 //get atoms from server
 ctrl.fetch = function(id) {
  //check for undefined or empty input
  if(ctrl.input.name == undefined || ctrl.input.name == '') {
    console.log('NO NAME');
  }
  else {
      //show progress bar
      ctrl.progress.increment();
      ctrl.progress.started = true;
      ctrl.progress.value = 20;
      //remove welcome message
      if(angular.element('#welcome'))
        angular.element('#welcome').remove();

      //reset input
      ctrl.input.reset();

    console.log('fetching... ' + id);
    $http.get(serverUrl + 'pdbs/' + id)
      .success(function(data) {
            console.log(data);
            ctrl.progress.increment()
            //add protein to scene and to list of proteins
            var protein = PARSER.addPdbObject(SCENE.scene, data.atoms, data.centroid, ctrl.input.color);
            ctrl.proteins[id] = protein;

            ctrl.progress.increment()

            //hide progress bar
            ctrl.progress.started = false;

            //add to list of structures
            ctrl.structures.push({id: id, style: {'border-top-color': ctrl.input.color}})

            //rotate through colors
            ctrl.setColor(ctrl.colorIndex++);
      })
      .error(function(err) {
            //hide progress bar
            ctrl.progress.started = false;

        //stop spinner
        spinner.stop();

        console.log(err);
      })
  }
 };
    /** callback after surf file has been read */
    ctrl.readerCallback = function (file, data) {
        //remove welcome message
        if(angular.element('#welcome'))
            angular.element('#welcome').remove();
        var id = file.name.split('.')[0];
        //parse surf data
        var object = PARSER.surfParser(data);
        //add to scene
        var surfMesh = PARSER.addSurfObject(SCENE.scene, object, 'red');
        //add to a list of surf meshes
        ctrl.surfs[id] = surfMesh;
        //add to an array of surf
        ctrl.surfaces.push({id: id})
    }
    /** Surface file reader */
    ctrl.fileReader = function(event){
        if(window.File && window.FileReader && window.FileList && window.Blob) {
            console.log('File reader is supported!');
            console.log(event);
        }
        else
            console.log('File reader API is not supported!');
    }
    //ctrl.fileReader();
    /** ng-file-upload init */
    ctrl.myModelObj;
    ctrl.className = "dragover";
    ctrl.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            ctrl.upload = $upload.upload({
                url: 'server/upload/url', //upload.php script, node.js route, or servlet url
                // method: 'POST' or 'PUT',
                // headers: {'header-key': 'header-value'},
                // withCredentials: true,
                data: {myObj: ctrl.myModelObj},
                file: file // or list of files: $files for html5 only
                // fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file
                /* customize file formData name ('Content-Desposition'), server side file variable name.
                 Default is 'file' */
                //fileFormDataName: myFile, //or a list of names for multiple files (html5).
                /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
                //formDataAppender: function(formData, key, val){}
            }).progress(function(evt) {
                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
            }).success(function(data, status, headers, config) {
                // file is uploaded successfully
                console.log(data);
            });
            //.error(...)
            //.then(success, error, progress);
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
    };

    ctrl.colorPicker = function () {
        var x = $('.colorpicker');
        x.colorpicker();
        x.colorpicker('show');

        console.log(x);
    }
    //toggle pdb object visibility
    ctrl.vToggle = function (id) {
        console.log('toggle', id)
        ctrl.proteins[id].visible = !ctrl.proteins[id].visible;
    }

    //toggle surf object visibility
    ctrl.surfToggle = function (id) {
        console.log('toggle', id)
        ctrl.surfs[id].visible = !ctrl.surfs[id].visible;
    }
  //get objects from Bark
  ctrl.get = function () {
    //TODO: is wiping the best way?
    //wipe out current list
    ctrl.barkObjects = [];
    $http.get('http://bark.cse.lehigh.edu:3000/objects')
          .success(function(data){
            for(var i=0; i<data.objects.length;i++) {
              //console.log(data.objects[i]);
               ctrl.barkObjects.push(data.objects[i]);

               //reference currentObject to add color and style
               var currentObject = ctrl.barkObjects[i];
                currentObject.color = rainbow(16, i + 3);
                currentObject.style = {"background-color": currentObject.color};
            }
        })
  }

  ctrl.add = function(obj) {
      //if input is undefined or empty
      if(ctrl.input == undefined || ctrl.input.name == '') {
          console.log('NO NAME INPUT');
      }
      //if input is defined
      else {
          ctrl.barkObjects.push({name: obj,
            color: rainbow(16, ctrl.barkObjects.length + 4),
            style: {'background-color': ctrl.barkObjects[ctrl.barkObjects.length-1].color }});
          console.log(ctrl.barkObjects[ctrl.barkObjects.length-1]);
          ctrl.input.name = '';
      }
  };

  ctrl.vasp = function (op) {
      var result;
      switch (op) {
              case "U":
                  console.log("U on object " + ctrl.objects[ctrl.S].name +
                   ' and ' + ctrl.objects[ctrl.D].name);
                  var url = 'http://bark.cse.lehigh.edu:3000/vasp/' +
                   'u/' +
                 ctrl.objects[ctrl.S].name +
                    '&' +
                    ctrl.objects[ctrl.D].name;
                    $http.jsonp(url)
                    .success(function(data) {
                      console.log(data.toString());
                    });

                  break;
              case "I":
                  console.log("I on object " + ctrl.objects[ctrl.S].name +
                   ' and ' + ctrl.objects[ctrl.D].name);

                  break;
              case "D":
                  console.log("D on object " + ctrl.objects[ctrl.S].name +
                   ' and ' + ctrl.objects[ctrl.D].name);
                  break;
              default:
                  console.log("No valid operation");
      }
      angular.element(document.getElementById('tag')).toggleClass('ng-hide');
  }

  //render function to render objects received from server
  ctrl.render = function(index) {
    //if object exists
   if(window.scene.children[index+ctrl.offset]) {
      //toggle visible
      window.scene.children[index+ctrl.offset].visible = !window.scene.children[index+ctrl.offset].visible;
      console.log('Already exists!');
    }
    else {
      //var color = rainbow(16, index + 3);
      //add object
      addObject(ctrl.barkObjects[index], ctrl.barkObjects[index].color);

      //button color
      //ctrl.barkObjects[index].style = {"background-color": color};
    }
    //console.log(scene);

  //toggle active
    ctrl.barkObjects[index].active = !ctrl.barkObjects[index].active;
  }

  ctrl.handleDrop = function(targetId, sourceId) {
    console.log(targetId + ' ' + sourceId);
    //start spinner
    var spinner = new Spinner(ctrl.spinnerOpts).spin(ctrl.spinnerDiv);

    //get object from target and source id
    var source = ctrl.barkObjects[sourceId];
    var target = ctrl.barkObjects[targetId];

    //call VASP operation on source and target
    var op = 'i' //operation
    var url = 'http://bark.cse.lehigh.edu:3000/vasp/'
    + op
    + '/'
    + source.name
    + '&'
    + target.name //url to GET

    $http.get(url)
    .success(function(data) {
      console.log(data);

      //stop spinner
      spinner.stop();

      //reference currentObject to add color and style
      var currentIndex = ctrl.barkObjects.length;
      data.name = source.name + ' ' + op.toUpperCase() + ' ' + target.name;
      data.color = rainbow(16, currentIndex + 3);
      data.style = {"background-color": data.color};

      //add result to scence
      ctrl.barkObjects.push(data);

    })
    .error(function(e) {
      console.log('There is an error: ' + e);
    })

  }

  // //Initialize socket
  // //ctrl.urlSocket = 'http://bark.cse.lehigh.edu:3700';
  // ctrl.urlSocket = 'http://localhost:3700';
  // ctrl.socket = io.connect(ctrl.urlSocket);

  // ctrl.mouseCounter = 0;
  // //Get initial message from socket server
  // //Receiving data from socket server
  // ctrl.socket.on('message', function(data) {
  //     //welcome message
  //     console.log(data);
  //     if(data.message) {
  //         //Initialize the canvas for later use
  //         ctrl.canvas = document.getElementById("scene").children[0];
  //         ctrl.ctx = ctrl.canvas.getContext('2d');
  //         console.log(ctrl.ctx);
  //         //id
  //         console.log(ctrl.socket.socket.sessionid);
  //     }
  //     //processing data
  //     else if(data.mouseData) {
  //         //console.log(document.getElementById("layer2"));
  //         console.log(data);
  //         //if id === received id, the data is from self
  //         if(data.mouseData.id === ctrl.socket.socket.sessionid)
  //           console.log('This is from you!');
  //         //else, the data is from...
  //         else {
  //           //TODO: DRAW A POINTER BASED ON MOUSE DATA
  //           console.log(ctrl.ctx.canvas.clientWidth * data.mouseData.percentX);
  //           console.log(ctrl.ctx.canvas.clientHeight * data.mouseData.percentY);
  //           ctrl.ctx.fillRect(ctrl.ctx.canvas.clientWidth * data.mouseData.percentX,
  //             ctrl.ctx.canvas.clientHeight * data.mouseData.percentY
  //             ,10,10);
  //           //console.log('This is ' + ctrl.canvas.width);
  //           console.log('This is from: ' + data.mouseData.id);
  //         }
  //     }
  // });

  // ctrl.socket.on('newUser', function(data) {
  //   console.log(data);
  //   /*
  //   //if data of new user is different from self's id
  //   if(data.id != ctrl.socket.socket.sessionid)
  //     $scope.$apply(function(){
  //       ctrl.users.push({name: data.randomName, color: 'black'});
  //     });
  //   */
  //   $scope.$apply(function(){
  //     ctrl.users = data.users;
  //   });
  // });

  // ctrl.socket.on('queried', function(data) {
  //   console.log('sdasd');
  //   console.log('QUERIED: ' + data);
  // });

  // ctrl.socket.on('queriedControlData', function(data) {
  //   if(data.id == ctrl.socket.socket.sessionid) {
  //     console.log(controls);
  //     ctrl.socket.emit('sendControlData', {controls: controls});
  //   }
  // });
  //subscribes a room
  ctrl.subscribe = function(room) {
    ctrl.socket.emit('subscribe', {room: room});
  }

  //send controls data to other sockets
  ctrl.getControlData = function(id) {
    ctrl.scoket.emit('getControl', {id: id});
  }

  //return object with percentage of x and y with respect to the canvas
  ctrl.mousemove = function(e) {
    //console.log(e);
    ctrl.mouseCounter++;
    if(ctrl.mouseCounter == 50) {
      var mouseData = {id: ctrl.socket.socket.sessionid,
        percentX: e.offsetX/e.target.clientWidth,
        percentY: e.offsetY/e.target.clientHeight};
      ctrl.socket.emit('send', {mouseData: mouseData});
      ctrl.mouseCounter = 0;
    }
    else {
      //console.log('counter: ' + ctrl.mouseCounter);
    }

  };

  ctrl.queryUser = function(index) {
    ctrl.socket.emit('queryUser', {id: ctrl.users[index].id,
      name: ctrl.users[index].name});
    console.log('queryUser ' + ctrl.users[index].name);
  }

  ctrl.users = [];

  //function to get unique color in steps
  function rainbow (numOfSteps, step) {
      var r, g, b;
      var h = step / numOfSteps;
      var i = ~~(h * 6);
      var f = h * 6 - i;
      var q = 1 - f;
      switch(i % 6){
          case 0: r = 1, g = f, b = 0; break;
          case 1: r = q, g = 1, b = 0; break;
          case 2: r = 0, g = 1, b = f; break;
          case 3: r = 0, g = q, b = 1; break;
          case 4: r = f, g = 0, b = 1; break;
          case 5: r = 1, g = 0, b = q; break;
      }
      var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
      return (c);
  }

});
app.directive('fileread', function(){
   return {
       scope: {
           fileread: '='
       },
       link: function(scope, el, attrs){
           el.bind('change', function(changeEvent){
               var file = changeEvent.target.files[0];
               var reader = new FileReader();
               reader.onload = function(loadEvent){
                   scope.$apply(function(){
                       //run passed-in func after reader is loaded
                       scope.fileread(file, loadEvent.target.result);
                   });
               }
               reader.readAsText(file);
           })
       }
   }
});
//create a draggable directive
app.directive('draggable', function() {
  return function(scope, element) {
    //give the JS object
    var el =  element[0];

    el.draggable = true;

    el.addEventListener(
      'dragstart',
      function(e) {
        e.dataTransfer.effectAllowed = 'move';
        //log this out
        console.log('this: ' + this.id);

        e.dataTransfer.setData('text/plain', this.id);
        this.classList.add('drag');
        return false;
      },
      false
      );

    el.addEventListener(
      'dragend',
      function(e) {
        this.classList.remove('drag');
        return false;
      },
      false
      );
  }
});

//droppable directive
app.directive('droppable', function() {
  return {
    link: function(scope, element, attrs) {
      var el = element[0];

      el.addEventListener(
        'dragover',
        function(e) {
          e.dataTransfer.dropEffect = 'move';

          //allow to drop
          if (e.preventDefault) e.preventDefault();
          this.classList.add('over');
          return false;
        }, false);

      el.addEventListener(
        'dragenter',
        function(e) {
          this.classList.add('over');
          return false;
        }, false);

      el.addEventListener(
        'dragleave',
        function(e) {
          this.classList.remove('over');
          return false;
        }, false);

      el.addEventListener(
        'drop',
        function(e) {
          if(e.stopPropagation) e.stopPropagation();

          this.classList.remove('over');

          var source = e.dataTransfer.getData('text/plain');
          console.log('This is the data: ' + 'target: ' + el.id + ' origin: ' + source);
          //apply drop handler in the controller
          //TODO: clean this up by connecting to parent's scope
          console.log(scope.$parent);
          scope.$parent.ctrl.handleDrop(el.id, source);

          return false;
        }, false);
    }
  }
});
