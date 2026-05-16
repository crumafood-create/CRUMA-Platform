export const permissionsMatrix = {

  super_admin: [

    '*'
  ],

  admin: [

    'orders.read',
    'orders.write',
    'inventory.read'
  ],

  employee: [

    'orders.read'
  ]
};
