const express = require('express');
const app = express();
app.use(express.json());

const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomer,
  fetchRestaurant,
  createReservation,
  fetchReservation,
  destroyReservation,
} = require('./db');

app.get('/api/customer', async (req, res, next) => {
  try {
    res.send(await fetchCustomer());
  } catch (error) {
    next(error);
  }
});

app.get('/api/restaurant', async (req, res, next) => {
  try {
    res.send(await fetchRestaurant());
  } catch (error) {
    next(error);
  }
});

app.get('/api/reservation', async (req, res, next) => {
  try {
    res.send(await fetchReservation());
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer', async (req, res, next) => {
  try {
    res.status(201).send(await createCustomer(req.body.name));
  } catch (error) {
    next(error);
  }
});

app.post('/api/restaurant', async (req, res, next) => {
  try {
    res.status(201).send(await createRestaurant(req.body.name));
  } catch (error) {
    next(error);
  }
});
app.post('/api/customer/:customer_id/reservation', async (req, res, next) => {
  try {
    const reservation = await createReservation({
      customer_id: req.params.customer_id,
      restaurant_id: req.body.restaurant_id,
      reservation_date: req.body.reservation_date,
      party_count: parseInt(req.body.party_count, 10), // <--makes int with base 10 number
    });
    res.status(201).send(reservation);
  } catch (error) {
    next('Error creating reservation', error);
  }
});

app.delete(
  '/api/customer/:customer_id/reservation/:id',
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ error: 'Internal Server Error' });
});

const init = async () => {
  console.log('connecting to database');
  await client.connect();
  console.log('connected to database');
  console.log('creating tables');
  await createTables();
  console.log('created tables');

  const customers = await Promise.all([
    createCustomer('Lauren'),
    createCustomer('Jim'),
    createCustomer('Kim'),
  ]);

  const restaurants = await Promise.all([
    createRestaurant('BlueFin'),
    createRestaurant(`Joe's Steak House`),
    createRestaurant('Burger Queen'),
    createRestaurant('PancaKe FiddLes'),
  ]);
  console.log('data seeded');
  console.log(await fetchCustomer());
  console.log(await fetchRestaurant());

  const [lauren, jim, kim] = customers;
  const [blueFin, joesSteakHouse, burgerQueen, pancakeFiddles] = restaurants;

  const reservationDate = new Date(2024, 5, 21);

  const [reservation, reservation2, reservation3, reservation4] =
    await Promise.all([
      createReservation({
        customer_id: jim.id,
        restaurant_id: blueFin.id,
        reservation_date: reservationDate,
        party_count: 4,
      }),
      createReservation({
        customer_id: jim.id,
        restaurant_id: burgerQueen.id,
        reservation_date: '2024-6-1',
        party_count: 3,
      }),
      createReservation({
        customer_id: lauren.id,
        restaurant_id: joesSteakHouse.id,
        reservation_date: reservationDate,
        party_count: 2,
      }),
      createReservation({
        customer_id: kim.id,
        restaurant_id: pancakeFiddles.id,
        reservation_date: reservationDate,
        party_count: 5,
      }),
    ]);

  console.log(' Reservations Pre-Delete -->', await fetchReservation());

  await destroyReservation({ id: reservation.id, customer_id: jim.id });
  await destroyReservation({ id: reservation3.id, customer_id: lauren.id });
  console.log('Reservations After Destroy -->', await fetchReservation());

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
    console.log('some curl commands to test');
    console.log(
      `curl -X DELETE localhost:${port}/api/customer/${kim.id}/reservation/${reservation4.id}`
    );

    console.log(
      `curl -X POST localhost:${port}/api/customer/${lauren.id}/reservation -d '{"restaurant_id": "${joesSteakHouse.id}", "reservation_date": "2024-06-12", "party_count": 3}' -H 'Content-Type: application/json'`
    );

    console.log(`curl localhost:${port}/api/customer`);
    console.log(`curl localhost:${port}/api/restaurant`);
    console.log(`curl localhost:${port}/api/reservation`);
  });
};

init();
