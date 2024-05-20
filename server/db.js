const pg = require('pg');
const { v4: uuidv4 } = require('uuid');

const { Client } = pg;

const client = new Client(
  process.env.DATABASE_URL || {
    user: 'jennifersimond',
    password: 'Pa$$w0rd',
    host: 'localhost',
    port: 5432,
    database: 'acme_reservations_db',
  }
);

const createTables = async () => {
  const SQL = `

  DROP TABLE IF EXISTS reservation;
    DROP TABLE IF EXISTS restaurant;
    DROP TABLE IF EXISTS customer CASCADE;
    

    CREATE TABLE customer (
      id UUID PRIMARY KEY,
      name VARCHAR
    );

    CREATE TABLE restaurant (
      id UUID PRIMARY KEY,
      name VARCHAR
    );

    CREATE TABLE reservation (
      id UUID PRIMARY KEY,
      reservation_date DATE NOT NULL,
      party_count INTEGER NOT NULL,
      customer_id UUID REFERENCES customer(id) NOT NULL,
      restaurant_id UUID REFERENCES restaurant(id) NOT NULL
    );
  `;

  await client.query(SQL);
  return;
};

// Customer Functions
const createCustomer = async (name) => {
  const SQL = `
  
  INSERT INTO customer (id, name) VALUES ($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuidv4(), name]);
  return response.rows[0];
};

const fetchCustomer = async () => {
  const SQL = `
  SELECT * FROM customer
  `;
  const response = await client.query(SQL);
  return response.rows;
};

//Restaurant Functions

const createRestaurant = async (name) => {
  const SQL = `
  INSERT INTO restaurant (id, name) VALUES ($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuidv4(), name]);
  return response.rows[0];
};

const fetchRestaurant = async () => {
  const SQL = `
  SELECT * FROM restaurant
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Reservation functions
const createReservation = async ({
  customer_id,
  restaurant_id,
  reservation_date,
  party_count,
}) => {
  const SQL = `
  INSERT INTO reservation(id, customer_id,
    restaurant_id,
    reservation_date,
    party_count) VALUES($1, $2, $3, $4, $5) RETURNING *
    `;
  const response = await client.query(SQL, [
    uuidv4(),
    customer_id,
    restaurant_id,
    reservation_date,
    party_count,
  ]);
  return response.rows[0];
};

const fetchReservation = async () => {
  const SQL = `
  SELECT * FROM reservation
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const destroyReservation = async ({ id, customer_id }) => {
  console.log(id, customer_id);
  const SQL = `
  DELETE FROM reservation WHERE id = $1 AND customer_id = $2;
  `;
  await client.query(SQL, [id, customer_id]);
};

module.exports = {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomer,
  fetchRestaurant,
  createReservation,
  fetchReservation,
  destroyReservation,
};
