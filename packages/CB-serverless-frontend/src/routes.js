import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Header from './components/header';
import CategoryItems from './components/Category/CategoryItems';
import { fetchAllOrders } from './actions/order';

import AuthModule from './Auth';
import ProductHome from './components/Product/ProductHome';
import { updateAuth } from './Auth/actionCreators';
import CartHome from './components/Cart/CartHome';
import OrderPlaced from './components/order-placed';
import ProfileHome from './components/ProfileHome';
import BillReceipt from './components/Cart/BillReceipt';
import OrderList from './components/order-list';

const DefaultLayout = ({component: Component, ...rest}) => (
  <Route
    {...rest}
    render={matchProps => (
      <div>
        <Header />
        <Component {...matchProps} />
      </div>
  )} />
);

class Routes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginReady: false,
    };
  }

  async componentDidMount() {
    try {
      this.resetAndStartAuthentication();
      Auth.currentSession().then(async (response) => {
        const data = await Auth.currentAuthenticatedUser();
        const userData = await Auth.currentUserInfo();
        this.props.updateAuth({
          isAuthenticating: false,
          isAuthenticated: true,
          userData,
          identityId: data,
        });
        this.props.fetchAllOrders();
      }).catch((error) => {
        this.finishAuthentication();
      });
    } catch (e) {
      // to do
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.loginReady && this.props.isAuthenticating && !nextProps.isAuthenticating) {
      this.setState({ loginReady: true });
    }
  }

  resetAndStartAuthentication = () => {
    this.props.updateAuth({
      isAuthenticating: true,
      isAuthenticated: false,
      identityId: null,
      userData: null,
    });
  };

  finishAuthentication = () => {
    this.props.updateAuth({
      isAuthenticating: false,
    });
  };

  render() {
    return (
      <Router>
        <div className="root-container">
          {
          !this.props.isAuthenticated && this.state.loginReady ?
            <Route render={(matchProps) => <AuthModule {...matchProps} />} />
          :
          (this.state.loginReady ?
            <React.Fragment>
              <DefaultLayout exact path="/" component={ProductHome} />
              <DefaultLayout exact path="/category/:category" component={CategoryItems} />
              <DefaultLayout exact path="/category/" component={CategoryItems} />
              <DefaultLayout exact path="/profile" component={ProfileHome} />
              <DefaultLayout exact path="/cart" component={CartHome} />
              <DefaultLayout exact path="/checkout" component={BillReceipt} />
              <DefaultLayout exact path="/order-placed" component={OrderPlaced} />
              <DefaultLayout exact path="/order-list" component={OrderList} />
            </React.Fragment>
            :
            null
          )
        }
        </div>
      </Router>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isAuthenticating: state.auth.isAuthenticating,
  identityId: state.auth.identityId,
});

const mapDispatchToProps = dispatch => ({
  updateAuth: bindActionCreators(updateAuth, dispatch),
  fetchAllOrders: bindActionCreators(fetchAllOrders, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Routes);
