/*
In the student view, displays code and comments of a graded submission. 
*/

// Required packages
var React = require('react');
var ReactTabs = require('react-tabs');
var Highlight = require('react-highlight');
var ReactDOM = require('react-dom');

// React-Tabs Components
var Tab = ReactTabs.Tab;
var Tabs = ReactTabs.Tabs;
var TabList = ReactTabs.TabList;
var TabPanel = ReactTabs.TabPanel;

/*
CodeDisplay
@render: Renders tabs for each file. Each tab contains the file's code and comments.

@prop files: array of files
@prop deductions: array of deductions by file, same indexing as files param
@prop comments: array of comment lists by file, same indexing as files param.
*/
var CodeDisplay = React.createClass({
    getInitialState: function() {
      return {
        tab: 0,
      }
    },

    handleSelect: function (index, last) {
      this.setState({tab: index});
    },

    getTabTitle: function (tabName, deduction, numComments) {

      var deductionString = "";
      if (deduction > 0) {
        deductionString = " (-" + deduction + ")";
      }

      var commentFlag = "";
      if (numComments > 0) {
        commentFlag = (<div className="tabTitleNumComments">{numComments}</div>);
      }

      return (
        <div className="tabTitle">
          {commentFlag}
          <div className="tabTitle">
            {tabName + deductionString}
          </div>
        </div>

      )
    },


  render: function() {

    // Two sections here: one for code...and one for comments
        // Eventually: we want to be able to dynamically call out specific lines
        // based on the state of the comment box
    return (
      <Tabs onSelect={this.handleSelect} selectedIndex={this.state.tab}>
          <TabList>
            {this.props.files.map(function(item, i) {
              var tabTitle = this.getTabTitle(item.name, this.props.deductions[i], this.props.comments[i].length);
                return (
                  <Tab id="{i}" key={i} className="fileTab">{tabTitle}</Tab>
                  );
              }, this)}
          </TabList>

          {this.props.files.map(function(item, i) {
              return (

                <TabPanel key={i}>
                  <div className="submissionContainer">
                    <div className="codeBox">
                      <CodeBox data={item.code} 
                               comments={this.props.comments[i]} />
                </div>

                <CommentBox data={this.props.comments[i]} />
              </div>

            </TabPanel>                 
                );
            }, this)}
        </Tabs>
    )
  }
});



/*
CommentBox
Other than for styling in CSS, serves no real purpose. Hope is to eventually include
comment summaries in this object.
@render: A CommentList

@prop data: array of comments for this file
*/
var CommentBox = React.createClass({
  render: function() {

    return (
      <div className="commentBox">
        <CommentList data={this.props.data} />
      </div>
    );
  }
});


/*
CommentList
@render: A div with the comments stacked according to their proper line numbers.

@prop data: array of comments for this file. 
*/
var CommentList = React.createClass({
  render: function() {
    // Store estimated pixel ranges of comment blocks to help with stacking
    var ranges = [];

    // Sort comments by startLine to help with stacking
    let key = "startLine"
    this.props.data.sort(function(a, b) {
          return a[key] - b[key];
      });

    var commentNodes = (this.props.data).map(function(comment) {

      // Figure out where to place comment vertically
      // Placement model: 
      //    - Make comment position fixed
      //    - Set upper margin at <startLine> em down from top

      var startAt = (parseInt(comment.startLine, 10)+1)*15; // Each line is 15px

      // If a comment starts in the range of another block, then push it down until it fits
      // Don't need to check for trailing comments because already sorting by startLine
      for (var block = 0; block < ranges.length; block++) {
        if (startAt >= ranges[block][0] && startAt < ranges[block][1]) {
          startAt = ranges[block][1];
        }
      }

      // Estimate the pixel size of a comment block
      var dedLines = 0;
      let deductionKey = "deduction"
      if (comment[deductionKey] !== 0) {
        dedLines = 1;
      }
      var tagLines = 0;
      let tagKey = "tags"
      if (comment[tagKey].length !== 0) {
        tagLines = 1;
      }

      let textKey = "text"
      var lines = (parseInt(comment[textKey].length / 36, 10) + 3 + dedLines + tagLines) * 15;
      var newBlock = [startAt, startAt + lines];
      ranges.push(newBlock);

      ranges.sort(function(a, b) {
          return a[0] - b[0];
      });


      var style = {
        "marginTop" : startAt + "px",
      }; 


      return (
        <Comment id={comment.id} 
             data={comment}
             style={style} />
      )
    }.bind(this));

    return (
      <div className="commentList">
        {commentNodes}
      </div>
    )
  }
});



/*
Comment
@render: Creates a box with the comment text, tags, and deductions

@prop id: Int comment ID
@prop data: comment data. Has fields <text>, a string of the comment text
           and <tags>, an array of comment tags. 
@prop style: CSS style of the comment box
*/
var Comment = React.createClass({
  getInitialState: function() {
      return {
        hover: false,
      }
    },

  onMouseOver: function(i, e) {
    var elems = document.getElementsByClassName(i);

    for (var i = 0; i < elems.length; i++) {
        elems[i].style.backgroundColor = "#FAFF91";
    }
    
    this.setState({hover : true});
  },

  onMouseOut: function(i, e) {
    var elems = document.getElementsByClassName(i);

    for (var i = 0; i < elems.length; i++) {
        elems[i].style.backgroundColor = "#ffca93";
    }

    this.setState({hover : false});
  },

  render: function() {
    var tags = null;
    var deduction = ((this.props.data.deduction === 0) ? "" : (-(this.props.data.deduction)));
    if (this.props.data.length !== 0) {
      tags = this.props.data.tags.map(function(tag) {
        return (
          <p>@{tag}</p>
        )
      });     
    }

    var commentTags = <div className="comment-tags">{tags}</div>
    if (this.props.data.tags.length === 0) {
      commentTags = null;
    }

    return (
      <div style={this.props.style} className="comment-container">
        <div 
           className="comment" 
           onMouseEnter={this.onMouseOver.bind(this, this.props.data.id)} 
           onMouseLeave={this.onMouseOut.bind(this, this.props.data.id)}>     

            <div className="comment-deduction">
              {deduction}
            </div>
            {this.props.data.text}
            {commentTags}
        </div>
      </div>
    )
  }
});


/*
CodeBox

@render: div with lines of code, highlighted when corresponding to a comment

@prop data: String text code of the file
@prop comments: array of comments corresponding to the file
*/
var CodeBox = React.createClass({
  getInitialState: function() {
    return {
      highlights: null,
    }
  },

  buildHighlightStructure: function(thecomments) {
    // build up data structure to compute highlights
    var highlightList = [];
    thecomments.map(function(item, i) {
      highlightList.push({
        'endChar' : item.endChar,       
        'endLine' : parseInt(item.endLine, 10),
        'id' : item.id,
        'startChar' : item.startChar,
        'startLine' : parseInt(item.startLine, 10),
      });
    });

    highlightList.sort(function(a, b) {
      return a.startLine > b.startLine;
    });

    this.setState({highlights: highlightList})
  },

  componentWillMount: function() {
    this.buildHighlightStructure(this.props.comments);
  },

  componentWillReceiveProps: function(nextProps) {
    this.buildHighlightStructure(nextProps.comments);
  },

  highlightText: function(thetext, line) {
    var highlights = this.state.highlights;
    var part1 =""
    var part2 = ""
    var part3 = ""

    for (var i = 0; i < highlights.length; i++) {
      if (highlights[i].startLine < line && highlights[i].endLine > line) {
        // this line sits between a multi-line highlight
        return (<strong className={highlights[i].id}>{thetext}</strong>);

      } else if (highlights[i].startLine === line) {
        // we may be in a partial highlight situation

        // is the whole comment in one line?
        if (highlights[i].endLine === highlights[i].startLine) {
          part1 = thetext.substring(0, highlights[i].startChar);
          part2 = thetext.substring(highlights[i].startChar, highlights[i].endChar);
          part3 = thetext.substring(highlights[i].endChar, thetext.length).replace(/\s*$/,"");
          return (<font>{part1}<strong className={highlights[i].id}>{part2}</strong>{part3}</font>);          
        } else {
          part1 = thetext.substring(0, highlights[i].startChar);
          part2 = thetext.substring(highlights[i].startChar, thetext.length).replace(/\s*$/,"");
          return (<font>{part1}<strong className={highlights[i].id}>{part2}</strong></font>);
        }


      } else if (highlights[i].endLine === line) {
        part1 = thetext.substring(0, highlights[i].endChar);
        part2 = thetext.substring(highlights[i].endChar, thetext.length).replace(/\s*$/,"");
        return (<font><strong className={highlights[i].id}>{part1}</strong>{part2}</font>);
      }

      // otherwise, the highlight ends before our line starts
    }

    return thetext;
  },

  buildLineNumbers: function(numLines) {
    var lineNums = [];
    for (var i = 1; i <= numLines; i++) {
      var tmpLine = <div key={i} className="lineNumber">{i}</div>;
      lineNums.push(tmpLine);
    }
    return lineNums;
  },

    render: function() {
      var splitCode = this.props.data.split('\n');
      var linesOfCode = splitCode.map(function(item, i) {
        return (
          <div key={i} onMouseUp={this.onMouseUp} id={i}>{this.highlightText(item, i)}</div>
        );
      }.bind(this));
      var lineNumbers = this.buildLineNumbers(splitCode.length);

    return (
      <div className='sublime'>
        <div className='lineNumbers'>
          {lineNumbers}
        </div>
        <div className="highlightedArea">
            <Highlight className='java'>
              {linesOfCode}
          </Highlight>
        </div>
      </div>
    );
    }
});


module.exports = CodeDisplay;