/*
student.jsx is the main file for the student view
*/
var React = require('react');
var ReactDOM = require('react-dom');
var Pane = require('./vertical_pane.jsx');
var ReactTabs = require('react-tabs');
var LoadingAni = require('./loading.jsx');
var CodeDisplay = require('./components/student/codeviewer.jsx');

// React-Tabs Components
var Tab = ReactTabs.Tab;
var Tabs = ReactTabs.Tabs;
var TabList = ReactTabs.TabList;
var TabPanel = ReactTabs.TabPanel;

/*
App 

@render: Renders a CourseSelector Object and a ContentArea object
*/
var App = React.createClass({
  getInitialState: function() {
    return {
      loadedAssignment_id: null,
      loadedAssignment_name: null,
      loadedCourse_id: null,
    }
  },

  changeLoadedAssignment: function(id, name) {
    this.setState({
      loadedAssignment_id: id,
      loadedAssignment_name: name,
    });

  },

  changeLoadedCourse: function(course) {
    // Changing course deselects acitve assignment
    this.setState({
      loadedAssignment_id: null,
      loadedAssignment_name: null,
      loadedCourse_id: course,
    });
  },

  render: function() {

    return (
      <div>
        <CourseSelector
            firsturl="/api/student-courses/"
            secondurl="/api/student-assignmentinstances/"
            onAssnChange={this.changeLoadedAssignment}
            onCourseChange={this.changeLoadedCourse}  />
         <div className="contentContainer">
          <ContentArea assnName={this.state.loadedAssignment_name}
                       subid={this.state.loadedAssignment_id} />
        </div>
      </div>
    );
  }
});

/*
CourseSelector retrieves a student's courses and the Assignment Instances of each course. 
@render: <Pane> object with student's courses and Assignment Instances. 

@props firsturl: api endpoint to get student courses
@props secondurl: api endpoint to get a student's assignments
@props onAssnChange: function to change the assignment loaded on the student view. Called when a new 
            assignment is selected in the CourseSelector
@props onCourseChange: function to change assignments displayed in CourseSelector. Called when a new 
            course is selected 
*/
var CourseSelector = React.createClass({
  getInitialState: function() {
    return {
      firstitems: null,
      seconditems: null,
    } 
  },

  loadFirstItems: function() {
    $.ajax({
          data: {},
          method: 'GET',
          url: this.props.firsturl,
          success: function (data) {

              // Update state variables
              if (this.isMounted()) {

              // put newest courses first in list
              function compare(a,b) {
              if (a.id < b.id)
                { return 1; }
              if (a.id > b.id)
                { return -1; }
              return 0;
          }

          data.sort(compare);

           // Make an Ajax call for each first item
           var seconditems = []; // to build up seconditems state
           var promises = [];
           var secondurl = this.props.secondurl;

           // For each firstitem, look up corresponding second item
             $(data).each(function(index,element) {
              promises.push($.ajax({
                    method: 'GET',
                    url:  secondurl + element.id, // firstitem must have an id
                    data: {},
                    success: function (childdata) {
                      var seconditemlist = []; // store seconditems as lists
                       $(childdata).each( function(childindex,childelement) {
                        var name = childelement.name;
                        var id = childelement.id;
                          seconditemlist.push({id:id, name: name});
                         });

                        // Sort assignment list by id
                        var orderedseconditemslist = seconditemlist.sort(function(a, b) {
                      return parseFloat(a.id) - parseFloat(b.id);
                  });

                         // Update temporary state variables
                         // Have to use dictionary not list to guarantee ordering b/w
                         // async AJAX calls.
                        seconditems[element.id] = orderedseconditemslist;
                    }.bind(this),

                     // Pretty ungraceful handle. Should eupdate this to show some warning/error.
                    error: function (info) {
                         alert("Something went wrong with the child ajax call. " + info);
                    }
                })
              );
             })

            // Execute after every promise from ajax calls completed
          $.when.apply($, promises).always(function() {
            this.setState({firstitems: data, seconditems: seconditems});
          }.bind(this));

            }
          }.bind(this),

          // Pretty ungraceful handle. Should update this to show some warning/error.
          error: function (data) {
               alert("Something went wrong with the parent ajax call. " + data);
          }
      });
  },

  componentWillMount: function(){
    this.loadFirstItems();
  },

  render: function() {
    // For outermost container

    if (!this.state.firstitems || !this.state.seconditems) {
      return (
        <div className="courseSelector">
          <Pane isLoading={true} />
        </div>
      );
    } else {
      var firstSelected = this.state.firstitems[0].id;
      return (
        <div className="courseSelector">
          <div> 
            <Pane 
              firstitems={this.state.firstitems}
              seconditems={this.state.seconditems}
              firstSelected={firstSelected} 
                onSecondChange={this.props.onAssnChange}
              onFirstChange={this.props.onCourseChange} />
          </div>
        </div>
      );
    }
  }
});

/*
ContentArea makes a call to retrieve the files and comments of the student submission that
is selected in CourseSelector. 
@render: If the assignment is graded, displays grade and a <CodeDisplay> with the submission. 

@props assnName: String name of the currently selected Assignment Instance in CourseSelector
@props subid: Int id of the currently selected Assignment Instance in CourseSelector
*/
var ContentArea = React.createClass({

  getInitialState: function() {
    return {
      files: null, 
      comments: null,
      submission: null,
      notSubmitted: null,
    };
  },

  loadSubmission: function(subid) {
     $.ajax({
      url: '/api/student-submissions/' + subid,
      dataType: 'json',
      cache: true,
      success: function(data) {
    var submission = data[0];
    var comments = [];
    if (submission) {
      for (var i = 0; i < submission.files.length; i++) {
        var raw = submission.files[i].standard_comments;
        comments.push(JSON.parse(raw).results);
      }
      this.setState({notSubmitted: false});
      this.setState({files: submission.files, comments: comments, submission: submission});
    }
    else {
      this.setState({notSubmitted: true});
    }
      }.bind(this)
    });
  },

  componentWillMount: function() {
    if (this.props.subid) {
      this.loadSubmission(this.props.subid);
    }
    
  },

   componentWillReceiveProps: function(nextProps) {
    if (this.props.subid !== nextProps.subid) {
      this.loadSubmission(nextProps.subid);
      this.setState({files: null, comments: null});
    }
   },

    getDeductions: function() {
      if (this.state.comments !== null) {
        var deductions = []
        for (var i=0; i < this.state.comments.length; i++) {
          var fileComments = this.state.comments[i];
          var totalDeduction = 0;
          for (var j=0; j < fileComments.length; j++) {
            totalDeduction = totalDeduction + parseFloat(fileComments[j].deduction, "10");
          }
          deductions.push(totalDeduction);
        }
        return deductions;
      }
    },

  render: function() {

    var deductions = this.getDeductions();
    if (!this.props.subid) {
      return (
      <h2 className="unloadedMessage">Select an assignment on the left!</h2>    
      );
    }

    if (this.state.files && this.state.comments) {
      return (
        <div>
          <div className="gradeBox">
          {"Grade: "+this.state.submission.grade+"/"+this.state.submission.points}
          </div>
            <div className="contentBox">
              <CodeDisplay files={this.state.files}
                     deductions={deductions}
                           comments={this.state.comments} />
            </div>
          </div>
    );
    } else if (this.state.notSubmitted) {
      return (
        <h2 className="unloadedMessage">Your {this.props.assnName} has not yet been graded. </h2>
      );
    } else if (this.props.subid) {
      return (
        <div>Loading...</div>
      );
    }
  }
});


// following function is used to allow sideways srolling for long code, while keeping 
//    the CourseSelector on the left side of the window
$(window).scroll(function(){
  $('.courseSelector').css('left',-$(window).scrollLeft());
});


ReactDOM.render(
  <App />,
  document.getElementById('panel')
);
