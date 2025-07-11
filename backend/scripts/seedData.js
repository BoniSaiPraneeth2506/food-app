import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@university.edu',
    password: 'password123',
    phone: '+1-555-123-4567',
    role: 'student',
    studentId: 'STU001'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    password: 'password123',
    phone: '+1-555-234-5678',
    role: 'student',
    studentId: 'STU002'
  },
  {
    name: 'Admin User',
    email: 'admin@foodiehub.com',
    password: 'admin123',
    phone: '+1-555-999-0000',
    role: 'admin'
  },
  {
    name: 'Staff Member',
    email: 'staff@foodiehub.com',
    password: 'staff123',
    phone: '+1-555-888-0000',
    role: 'staff'
  }
];

const sampleMenuItems = [
  {
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, onion, and our special sauce on a toasted bun',
    price: 8.99,
    category: 'Burgers',
    image: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 25,
    prepTime: 12,
    tags: {
      isVegetarian: false,
      isSpicy: false,
      isPopular: true
    },
    ingredients: ['Beef patty', 'Lettuce', 'Tomato', 'Onion', 'Special sauce', 'Bun'],
    nutritionalInfo: {
      calories: 520,
      protein: 28,
      carbs: 35,
      fat: 32
    }
  },
  {
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomato sauce, and basil on our homemade pizza dough',
    price: 12.99,
    category: 'Pizza',
    image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 15,
    prepTime: 18,
    tags: {
      isVegetarian: true,
      isSpicy: false,
      isPopular: true
    },
    ingredients: ['Pizza dough', 'Mozzarella', 'Tomato sauce', 'Fresh basil'],
    nutritionalInfo: {
      calories: 680,
      protein: 32,
      carbs: 78,
      fat: 24
    }
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing',
    price: 9.99,
    category: 'Salads',
    image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 20,
    prepTime: 8,
    tags: {
      isVegetarian: true,
      isSpicy: false
    },
    ingredients: ['Romaine lettuce', 'Parmesan cheese', 'Croutons', 'Caesar dressing'],
    nutritionalInfo: {
      calories: 320,
      protein: 12,
      carbs: 18,
      fat: 24
    }
  },
  {
    name: 'Spicy Chicken Wrap',
    description: 'Grilled chicken with spicy mayo, lettuce, tomatoes, and peppers in a flour tortilla',
    price: 10.99,
    category: 'Wraps',
    image: 'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 18,
    prepTime: 10,
    tags: {
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    ingredients: ['Grilled chicken', 'Spicy mayo', 'Lettuce', 'Tomatoes', 'Peppers', 'Flour tortilla'],
    nutritionalInfo: {
      calories: 450,
      protein: 35,
      carbs: 28,
      fat: 22
    }
  },
  {
    name: 'Vegetarian Pasta',
    description: 'Penne pasta with mixed vegetables, marinara sauce, and fresh herbs',
    price: 11.99,
    category: 'Pasta',
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 12,
    prepTime: 15,
    tags: {
      isVegetarian: true,
      isVegan: true,
      isSpicy: false
    },
    ingredients: ['Penne pasta', 'Mixed vegetables', 'Marinara sauce', 'Fresh herbs'],
    nutritionalInfo: {
      calories: 380,
      protein: 14,
      carbs: 68,
      fat: 8
    }
  },
  {
    name: 'Fish & Chips',
    description: 'Beer-battered cod with crispy fries and tartar sauce',
    price: 13.99,
    category: 'Seafood',
    image: 'https://images.pexels.com/photos/1143754/pexels-photo-1143754.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 10,
    prepTime: 20,
    tags: {
      isVegetarian: false,
      isSpicy: false
    },
    ingredients: ['Cod fillet', 'Beer batter', 'Potatoes', 'Tartar sauce'],
    allergens: ['Fish', 'Wheat'],
    nutritionalInfo: {
      calories: 720,
      protein: 38,
      carbs: 65,
      fat: 35
    }
  },
  {
    name: 'Chocolate Brownie',
    description: 'Rich chocolate brownie served warm with vanilla ice cream',
    price: 6.99,
    category: 'Desserts',
    image: 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 30,
    prepTime: 5,
    tags: {
      isVegetarian: true,
      isSpicy: false
    },
    ingredients: ['Chocolate', 'Flour', 'Butter', 'Sugar', 'Eggs', 'Vanilla ice cream'],
    allergens: ['Eggs', 'Dairy', 'Wheat'],
    nutritionalInfo: {
      calories: 420,
      protein: 6,
      carbs: 52,
      fat: 22
    }
  },
  {
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 3.99,
    category: 'Beverages',
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400',
    stock: 50,
    prepTime: 2,
    tags: {
      isVegetarian: true,
      isVegan: true,
      isSpicy: false
    },
    ingredients: ['Fresh oranges'],
    nutritionalInfo: {
      calories: 110,
      protein: 2,
      carbs: 26,
      fat: 0
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie-hub';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Find admin user to use as creator for menu items
    const adminUser = createdUsers.find(user => user.role === 'admin');

    // Create menu items
    const menuItemsWithCreator = sampleMenuItems.map(item => ({
      ...item,
      createdBy: adminUser._id
    }));

    const createdMenuItems = await MenuItem.create(menuItemsWithCreator);
    console.log(`🍽️  Created ${createdMenuItems.length} menu items`);

    // Create sample orders
    const studentUser = createdUsers.find(user => user.role === 'student');
    const sampleOrders = [
      {
        user: studentUser._id,
        items: [
          {
            menuItem: createdMenuItems[0]._id,
            name: createdMenuItems[0].name,
            price: createdMenuItems[0].price,
            quantity: 2,
            subtotal: createdMenuItems[0].price * 2
          },
          {
            menuItem: createdMenuItems[7]._id,
            name: createdMenuItems[7].name,
            price: createdMenuItems[7].price,
            quantity: 1,
            subtotal: createdMenuItems[7].price
          }
        ],
        status: 'completed',
        paymentStatus: 'paid',
        subtotal: (createdMenuItems[0].price * 2) + createdMenuItems[7].price,
        tax: ((createdMenuItems[0].price * 2) + createdMenuItems[7].price) * 0.08,
        total: ((createdMenuItems[0].price * 2) + createdMenuItems[7].price) * 1.08,
        estimatedPrepTime: 15,
        actualPrepTime: 12,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }
    ];

    const createdOrders = await Order.create(sampleOrders);
    console.log(`📋 Created ${createdOrders.length} sample orders`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Sample login credentials:');
    console.log('Student: john.doe@university.edu / password123');
    console.log('Admin: admin@foodiehub.com / admin123');
    console.log('Staff: staff@foodiehub.com / staff123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();