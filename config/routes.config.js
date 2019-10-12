export default [
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/',
    component: '../layouts/BlankLayout',
    routes: [
      {
        routes: [
          {
            path: '/',
            redirect: '/home',
          },
          {
            path: '/Home',
            name: 'home',
            icon: 'smile',
            component: './Home',
          },
          {
            component: './404',
          },
        ],
      },
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
];
