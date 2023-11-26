const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Users = require('../models/userModel');


beforeAll(async () => {
  await mongoose.disconnect();
  const url = 'mongodb+srv://denys:010112ukdenis@cluster0.jenuhe7.mongodb.net/?retryWrites=true&w=majority'; // Update with your MongoDB connection URL
  await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
});


afterAll(async () => {
  await mongoose.disconnect();

});

describe('Authentication Routes', () => {
  let mockUser;

  beforeAll(() => {
    mockUser = {
      fullname: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password',
      gender: 'male',
    };
  });

  afterAll(async () => {
    await Users.deleteMany();
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send(mockUser)
        .expect(200);
      expect(response.body).toHaveProperty('msg', 'Register Success!');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('fullname', mockUser.fullname);
      expect(response.body.user).toHaveProperty('username', mockUser.username);
      expect(response.body.user).toHaveProperty('email', mockUser.email);
    });

  });

  describe('POST /api/login', () => {
    it('should log in a user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: mockUser.email, password: mockUser.password })

      expect(response.body).toHaveProperty('msg', 'Login Success!');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('fullname', mockUser.fullname);
      expect(response.body.user).toHaveProperty('username', mockUser.username);
      expect(response.body.user).toHaveProperty('email', mockUser.email);
    });


  });


});
describe('User Routes', () => {
  let mockUser;
  let authToken;

  beforeAll(async () => {
    mockUser = {
      fullname: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password',
      gender: 'male',
    };

    const registerResponse = await request(app).post('/api/register').send(mockUser);
    authToken = registerResponse.body.access_token;
    console.log(authToken);
  });

  afterAll(async () => {
    await Users.deleteMany();
  });

  describe('GET /api/search', () => {
    it('should search for users', async () => {
      const response = await request(app)
        .get('/api/search')
        .set('Authorization', `${authToken}`)
        .query({ username: 'johndoe' })
        .expect(200);


      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBeTruthy();
    });

  });

  describe('GET /api/user/:id', () => {
    it('should get user by ID', async () => {
      const user = await Users.findOne({ email: mockUser.email });

      const response = await request(app)
        .get(`/api/user/${user._id}`)
        .set('Authorization', `${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('_id', user._id.toString());
      expect(response.body.user).toHaveProperty('fullname', user.fullname);
      expect(response.body.user).toHaveProperty('username', user.username);
      expect(response.body.user).toHaveProperty('email', user.email);
    });
  });

  describe('PATCH /api/user', () => {
    it('should update user information', async () => {
      const updatedUser = {
        fullname: 'John Doe Updated',
        mobile: '1234567890',
        address: '123 ABC Street',
        story: 'Updated user story',
        website: 'https://updated-website.com',
        gender: 'female',
      };

      const response = await request(app)
        .patch('/api/user')
        .set('Authorization', `${authToken}`)
        .send(updatedUser)
        .expect(200);

      expect(response.body).toHaveProperty('msg', 'Update Success!');

      const user = await Users.findOne({ email: mockUser.email });

      expect(user).toHaveProperty('fullname', updatedUser.fullname);
      expect(user).toHaveProperty('mobile', updatedUser.mobile);
      expect(user).toHaveProperty('address', updatedUser.address);
      expect(user).toHaveProperty('story', updatedUser.story);
      expect(user).toHaveProperty('website', updatedUser.website);
      expect(user).toHaveProperty('gender', updatedUser.gender);
    });
  });

  describe('PATCH /api/user/:id/follow', () => {
    let otherUser;

    beforeAll(async () => {
      const newUser = await Users.create({
        fullname: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password',
        gender: 'female',
      });
      otherUser = newUser;
    });

    it('should follow a user', async () => {
      const response = await request(app)
        .patch(`/api/user/${otherUser._id}/follow`)
        .set('Authorization', `${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('newUser');
      // expect(response.body.newUser.followers).toContain(mockUser._id.toString());

      const user = await Users.findOne({ email: mockUser.email });

      // expect(user.following[0]).toBe(otherUser._id.toString());
    });

    // Add more test cases for already following, non-existent user, unauthorized access, etc.
  });

  describe('PATCH /api/user/:id/unfollow', () => {
    let otherUser;

    beforeAll(async () => {
      const newUser = await Users.create({
        fullname: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password',
        gender: 'female',
      });
      otherUser = newUser;

      await Users.findByIdAndUpdate(mockUser._id, { following: [otherUser._id] });
      await Users.findByIdAndUpdate(otherUser._id, { followers: [mockUser._id] });
    });

    it('should unfollow a user', async () => {
      const response = await request(app)
        .patch(`/api/user/${otherUser._id}/unfollow`)
        .set('Authorization', `${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('newUser');
      // expect(response.body.newUser.followers).not.toContain(mockUser._id.toString());

      const user = await Users.findOne({ email: mockUser.email });

      expect(user.following).not.toContain(otherUser._id.toString());
    });

    // Add more test cases for not following, non-existent user, unauthorized access, etc.
  });

  describe('GET /api/suggestionsUser', () => {
    it('should get suggested users', async () => {
      const response = await request(app)
        .get('/api/suggestionsUser')
        .set('Authorization', `${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBeTruthy();
      expect(response.body).toHaveProperty('result', response.body.users.length);
    });
  });

  describe('GET /api/findUser/:id', () => {
    let otherUser;

    beforeAll(async () => {
      const newUser = await Users.create({
        fullname: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password',
        gender: 'female',
      });
      otherUser = newUser;
    });

    it('should find a user', async () => {
      const response = await request(app)
        .get(`/api/findUser/${otherUser._id}`)
        .set('Authorization', `${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(Array.isArray(response.body.user)).toBeTruthy();
      expect(response.body).toHaveProperty('result', response.body.user.length);
    });
  });
});