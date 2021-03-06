let bs          = require('react-bootstrap');
let React       = require('react');
let ReactDOM    = require('react-dom');
let $           = require('jquery');
let menu        = require('../menu');
let auth        = require('./auth');
let format      = require('./format');

/** Navigation bar for layout.jade */
let Navigation = React.createClass({
  /** Get initial state */
  getInitialState() {
    return {
      credentials:        auth.loadCredentials(),
      credentialsMessage: undefined
    };
  },

  /** Log-in open a authentication URL */
  signIn() {
    window.open(auth.buildLoginURL(), '_blank');
  },

  /** Log out (clear credentials) */
  signOut() {
    // Clear credentials
    auth.saveCredentials(undefined);
    // Update state
    this.setState({credentials: undefined});
  },

  /** Listen for credentials-changed events */
  componentDidMount() {
    window.addEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Stop listening for credentials-changed events */
  componentWillUnmount() {
    window.removeEventListener(
      'credentials-changed',
      this.handleCredentialsChanged,
      false
    );
  },

  /** Credentials changed */
  handleCredentialsChanged(e) {
    // Reload credentials
    this.setState({
      credentials: e.detail,
      credentialsMessage: e.detail? {
        title: "Signed In",
        body: "You are now signed in as " + e.detail.clientId + ".",
      } : {
        title: "Signed Out",
        body: "You are now signed out.",
      }
    });
  },

  /** Render navigation bar */
  render() {

    // Find active menu entry
    var activeEntry = menu.filter(function(entry) {
      return entry.link === window.location.pathname;
    }, this)[0] || {title: "Unknown Page"};
    // Remove title on landing page
    if (window.location.pathname === '/') {
      activeEntry = null;
    }

    // Construct the navbar
    return (
      <bs.Navbar fluid={true} inverse={true} staticTop={true}>
        <bs.Navbar.Header>
          <bs.Navbar.Brand>
            <a href="/">
              <img src="/lib/assets/taskcluster-36.png" width="36" height="36"/>
              &nbsp;
              TaskCluster Tools
            </a>
          </bs.Navbar.Brand>
        </bs.Navbar.Header>
        <bs.Navbar.Text>
          {
            activeEntry ? (
              <span>
                <format.Icon name={activeEntry.icon || 'wrench'} fixedWidth/>
                &nbsp;&nbsp;
                {activeEntry.title}
              </span>
            ): undefined
          }
        </bs.Navbar.Text>
        <bs.Nav pullRight={true}>
          <bs.NavDropdown key={1} title="Tools" id="tools">
            {
              menu.filter(entry => entry.display).map((entry, index) => {
                if (entry.type === 'divider') {
                  return <bs.MenuItem key={index} divider/>;
                }
                return (
                  <bs.MenuItem key={index} href={entry.link}>
                    <format.Icon
                      name={entry.icon || 'wrench'}
                      fixedWidth/>&nbsp;&nbsp;
                    {entry.title}
                  </bs.MenuItem>
                );
              })
            }
          </bs.NavDropdown>
          {this.renderCredentialsMenu()}
        </bs.Nav>
        {this.renderCredentialsPopover()}
      </bs.Navbar>
    );
  },

  renderCredentialsMenu() {
    // if there are no credentials at all, then there is no menu -- just a sign-in link
    if (!this.state.credentials) {
      return <bs.NavItem onSelect={this.signIn} ref="credentials">
        <bs.Glyphicon glyph="log-in"/>&nbsp;Sign in
      </bs.NavItem>
    }

    // TODO: color this according to time until expiry
    let menuHeading = <span><bs.Glyphicon glyph='user'/>&nbsp; {this.state.credentials.clientId}</span>;
    return <bs.NavDropdown key={2} title={menuHeading} ref="credentials" id="credentials">
      <bs.MenuItem href="/credentials">
        <format.Icon name="key"/>&nbsp;Manage Credentials
      </bs.MenuItem>
      <bs.MenuItem divider />
      <bs.NavItem onSelect={this.signIn}>
        <bs.Glyphicon glyph="log-in"/>&nbsp;
        Sign In
      </bs.NavItem>
      <bs.NavItem onSelect={this.signOut}>
        <bs.Glyphicon glyph="log-out"/>&nbsp;
        Sign Out
      </bs.NavItem>
    </bs.NavDropdown>;
  },

  renderCredentialsPopover() {
    if (this.state.credentialsMessage) {
      let popover = <bs.Popover placement="bottom" id="signin-alert" title={this.state.credentialsMessage.title}>
        {this.state.credentialsMessage.body}
      </bs.Popover>;
      return <bs.Overlay
              show={true}
              rootClose={true}
              onHide={ () => this.setState({credentialsMessage: undefined}) }
              placement="bottom"
              target={ props => ReactDOM.findDOMNode(this.refs.credentials) }>
        {popover}
      </bs.Overlay>
    }
  },
});


/** Render Navigation */
$(function() {
  ReactDOM.render(
    <Navigation/>,
    $('#navbar')[0]
  );
});
