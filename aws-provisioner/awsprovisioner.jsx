/** @jsx React.DOM */
var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var format          = require('../lib/format');

// Should this be allowed to be set by user?
var provisionerId = 'aws-provisioner-v1';

/** BEGIN SUPER HACK */
var request = new XMLHttpRequest();
console.log('ignore this deprecation... once the API is in the upstream client we wont need '+
            'to do this anymore');
//request.open('GET', 'https://taskcluster-aws-provisioner2.herokuapp.com/v1/api-reference', false);
request.open('GET', 'http://localhost:5557/v1/api-reference', false);
request.send(null);
if (request.status === 200) {
  var reftxt = request.responseText;
  try {
    var reference = JSON.parse(reftxt);
    console.dir(reference);
  } catch(e) {
    console.log(e, e.stack);
    alert('Uh-oh, error: ' + e);
  }
} else {
  alert('Uh-oh, failed to load API reference');
}
//console.log('HIHIHIHH' + reference.baseUrl);
/* NOT FOR LOCALHOST
if (reference.baseUrl[4] !== 's') {
  console.log(reference.baseUrl);
  reference.baseUrl = 'https://' + reference.baseUrl.slice(7);
  console.log(reference.baseUrl);
}
*/
var AwsProvisionerClient = taskcluster.createClient(reference);
/** END SUPER HACK */

// Questions:
//  1. Should I create a client for each react class or share the parent classes?
//  2. Why does the aws-provisioner not allow cross-origin requests?


var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: AwsProvisionerClient,
      }
    }),
  ],

  getInitialState: function() {
    return {
      workerTypes: [],
      workerTypesLoaded: true,
      workerTypesError: undefined,
      awsState: {},
      awsStateLoaded: true,
      awsStateError: undefined,
      current: '',
    };
  },

  load: function() {
    this.awsProvisioner.awsState().then(console.log).catch(console.log);
    return {
      workerTypes: this.awsProvisioner.listWorkerTypes(),
      awsState: this.awsProvisioner.awsState(),
    };
  },
  
  render: function() {
    // TODO: Should write a note somewhere explaining what all these terms mean
    var that = this;
    return (
      <bs.Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>Worker Type Name</th>
            <th>Running Capacity</th>
            <th>Pending Capacity</th>
            <th>Requested Capacity</th>
            <th>Pending Tasks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {
          this.renderWaitFor('workerTypes') || this.renderWaitFor('awsState') || this.state.workerTypes.map(function(name) {
            return <WorkerTypeRow key={name} awsState={that.state.awsState[name]} workerType={name} />;
          })
        }
        </tbody>
      </bs.Table>
    );
  },
});

var WorkerTypeRow = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue: taskcluster.Queue,
      },
    }),
  ],

  propTypes: {
    workerType: React.PropTypes.string.isRequired,
    awsState: React.PropTypes.shape({
      running: React.PropTypes.arrayOf(React.PropTypes.object),
      pending: React.PropTypes.arrayOf(React.PropTypes.object),
      spotReq: React.PropTypes.arrayOf(React.PropTypes.object),
    }).isRequired,
  },

  getInitialState: function() {
    return {
      pendingTasks: {
        pendingTasks: 'loading',  
      },
      pendingTasksLoaded: true,
      pendingTasksError: undefined,
    };
  },

  load: function() {
    return {
      pendingTasks: this.queue.pendingTasks(provisionerId, this.props.workerType),
    };
  },

  render: function() {
    return this.renderWaitFor('pendingTasks') ||
    (<tr>
      <td>{this.props.workerType}</td>
      <td>{this.props.awsState.running.length}</td>
      <td>{this.props.awsState.pending.length}</td>
      <td>{this.props.awsState.spotReq.length}</td>
      <td>{this.state.pendingTasks.pendingTasks}</td>
      <td>
        <bs.ButtonToolbar>
        <bs.Button bsStyle='primary' bsSize='xsmall' onClick={this.handleDetails}>Details</bs.Button>
        {/* Hmm, should I allow deleting from here or should that only be under details...*/}
        {/*<bs.Button bsStyle='danger' bsSize='xsmall' onClick={this.handleDelete}>Delete</bs.Button>*/}
        </bs.ButtonToolbar>
      </td>
    </tr>);  
  },

  handleDetails: function() {
    alert('details ' + this.props.workerType);
  },

});

var AwsProvisioner = React.createClass({
  mixins: [
    // Calls load()
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.Index
      },
    }),
  ],

  propTypes: {
  },

  getInitialState: function() {
    return {
      workerType: "",
    };
  },

  load: function() {
    return {
    };
  },

  render: function() {
    return (
        <WorkerTypeTable />
    );
  },

});

// Export IndexBrowser
module.exports = AwsProvisioner;
