const AWS = require('aws-sdk');
const indexOf = require('lodash/indexOf');
const chalk = require('chalk');
const { awsConfigUpdate } = require('./awsConfigUpdate');

awsConfigUpdate();

const dynamodb = new AWS.DynamoDB();
/* Delete Tables */
const getDeleteParams = tableName => ({
  TableName: tableName,
});

const createGroceryTable = () => {
  const groceryParams = {
    TableName: 'grocery',
    KeySchema: [
      { AttributeName: 'groceryId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'groceryId', AttributeType: 'S' },
      { AttributeName: 'category', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 2,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GroceryCategoryIndex',
        KeySchema: [
          { AttributeName: 'category', KeyType: 'HASH' },
          { AttributeName: 'groceryId', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 2,
          WriteCapacityUnits: 2,
        },
      },
    ],
  };
  return dynamodb.createTable(groceryParams).promise();
};

const createOrderTable = () => {
  const orderParams = {
    TableName: 'orders',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'orderId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'orderId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 2,
    },
  };

  return dynamodb.createTable(orderParams).promise();
};

const createCartTable = () => {
  const userParams = {
    TableName: 'cart',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 2,
    },
  };

  return dynamodb.createTable(userParams).promise();
};
let tables;

const listTables = dynamodb.listTables({}).promise();

listTables
  .then((data, err) => {
    let groceryTablePromise,
      userTablePromise,
      orderTablePromise;

    groceryTablePromise = (indexOf(data.TableNames, 'grocery') === -1) ? createGroceryTable() : Promise.resolve();
    userTablePromise = (indexOf(data.TableNames, 'cart') === -1) ? createCartTable() : Promise.resolve();
    orderTablePromise = (indexOf(data.TableNames, 'order') === -1) ? createOrderTable() : Promise.resolve();

    return Promise.all([groceryTablePromise, userTablePromise, orderTablePromise]);
  })
  .then(() => {
    console.log(chalk.green('Created Tables Successfully'));
  })
  .catch((e) => {
    console.log(chalk.red('Could not create tables. Reason: ', e.message));
  });
