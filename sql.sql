create table coupons
(
    id                    int auto_increment
        primary key,
    code                  varchar(255)                                                      not null,
    description           varchar(255)                                                      null,
    type                  enum ('percentage', 'fixed', 'bogo') default 'percentage'         not null,
    value                 decimal(10, 2)                                                    not null,
    minimumOrderAmount    decimal(10, 2)                       default 0.00                 not null,
    maximumDiscountAmount decimal(10, 2)                                                    null,
    startDate             timestamp                                                         null,
    expiryDate            timestamp                                                         null,
    usageLimit            int                                                               null,
    usageCount            int                                  default 0                    not null,
    created_at            datetime(6)                          default CURRENT_TIMESTAMP(6) not null,
    updated_at            datetime(6)                          default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deleted_at            datetime(6)                                                       null,
    constraint IDX_e025109230e82925843f2a14c4
        unique (code)
);

create table ingredient_categories
(
    id          int auto_increment
        primary key,
    name        varchar(255)                             not null,
    description varchar(255)                             null,
    created_at  datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updated_at  datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deleted_at  datetime(6)                              null,
    constraint IDX_c46e6d713bc0107af340db99c8
        unique (name)
);

create table ingredients
(
    id           int auto_increment
        primary key,
    name         varchar(255)                                                                           not null,
    stock        decimal(14, 4)                                                                         not null,
    pricePerUnit decimal(14, 4)                                                                         not null,
    measurement  enum ('kg', 'g', 'l', 'ml', 'pc', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'gal', 'qt', 'pt') not null,
    warningAt    decimal(14, 4)                                                                         not null,
    created_at   datetime(6) default CURRENT_TIMESTAMP(6)                                               not null,
    updated_at   datetime(6) default CURRENT_TIMESTAMP(6)                                               not null on update CURRENT_TIMESTAMP(6),
    categoryId   int                                                                                    null,
    deleted_at   datetime(6)                                                                            null,
    constraint IDX_a955029b22ff66ae9fef2e161f
        unique (name),
    constraint FK_8f7060de1f9dc5d70ed029a1747
        foreign key (categoryId) references ingredient_categories (id)
);

create table menu_categories
(
    id          int auto_increment
        primary key,
    name        varchar(255)                             not null,
    description varchar(255)                             null,
    isActive    tinyint     default 1                    not null,
    created_at  datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updated_at  datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deleted_at  datetime(6)                              null,
    constraint IDX_30e8482d17959bb79ead70da22
        unique (name)
);

create table items
(
    id          int auto_increment
        primary key,
    name        varchar(255)                                                                           not null,
    price       decimal(10, 2)                                                                         not null,
    photo       varchar(255)                                                                           not null,
    description varchar(255)                                                                           not null,
    status      enum ('available', 'unavailable', 'seasonal', 'featured') default 'available'          not null,
    category_id int                                                                                    not null,
    created_at  datetime(6)                                               default CURRENT_TIMESTAMP(6) not null,
    updated_at  datetime(6)                                               default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deleted_at  datetime(6)                                                                            null,
    constraint IDX_213736582899b3599acaade2cd
        unique (name),
    constraint FK_0c4aa809ddf5b0c6ca45d8a8e80
        foreign key (category_id) references menu_categories (id)
);

create table item_ingredients
(
    id            int auto_increment,
    item_id       int                                                                                    not null,
    ingredient_id int                                                                                    not null,
    qty           decimal(10, 2)                                                                         not null,
    measurement   enum ('kg', 'g', 'l', 'ml', 'pc', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'gal', 'qt', 'pt') not null,
    created_at    datetime(6) default CURRENT_TIMESTAMP(6)                                               not null,
    updated_at    datetime(6) default CURRENT_TIMESTAMP(6)                                               not null on update CURRENT_TIMESTAMP(6),
    primary key (id, item_id, ingredient_id),
    constraint IDX_4d5ab5236fead1bb0a9d3884dc
        unique (item_id, ingredient_id),
    constraint FK_77fc134cf63e148c091034aebae
        foreign key (item_id) references items (id)
            on delete cascade,
    constraint FK_b386fe33755acb217c5f0344bb9
        foreign key (ingredient_id) references ingredients (id)
            on delete cascade
);

create table meals
(
    id          int auto_increment
        primary key,
    name        varchar(255)                                                                           not null,
    description varchar(255)                                                                           not null,
    price       decimal(10, 2)                                                                         not null,
    photo       varchar(255)                                                                           not null,
    status      enum ('available', 'unavailable', 'seasonal', 'featured') default 'available'          not null,
    category_id int                                                                                    not null,
    created_at  datetime(6)                                               default CURRENT_TIMESTAMP(6) not null,
    updated_at  datetime(6)                                               default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deleted_at  datetime(6)                                                                            null,
    constraint IDX_401178a19d37edc35f158d7da3
        unique (name),
    constraint FK_b30c25dc733e055a486b3807772
        foreign key (category_id) references menu_categories (id)
);

create table meal_items
(
    meal_id    int               not null,
    item_id    int               not null,
    quantity   int     default 1 not null,
    isActive   tinyint default 1 not null,
    deleted_at datetime(6)       null,
    primary key (meal_id, item_id),
    constraint FK_18e0df2ed0d1d1ade493a6b6819
        foreign key (meal_id) references meals (id)
            on delete cascade,
    constraint FK_8a66697d889cec120169a669c54
        foreign key (item_id) references items (id)
            on delete cascade
);

create index IDX_18e0df2ed0d1d1ade493a6b681
    on meal_items (meal_id);

create index IDX_8a66697d889cec120169a669c5
    on meal_items (item_id);

create table roles
(
    id          int auto_increment
        primary key,
    name        varchar(255)                             not null,
    description varchar(255)                             null,
    permissions json                                     not null,
    createdAt   datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    constraint IDX_648e3f5447f725579d7d4ffdfb
        unique (name)
);

create table role_permissions
(
    id       int auto_increment
        primary key,
    resource varchar(255) not null,
    actions  text         not null,
    role_id  int          null,
    constraint FK_178199805b901ccd220ab7740ec
        foreign key (role_id) references roles (id)
            on delete cascade
);

create table tables
(
    id         int auto_increment
        primary key,
    tableName  varchar(255)                                                                           not null,
    capacity   int                                                                                    not null,
    status     enum ('available', 'occupied', 'reserved', 'maintenance') default 'available'          not null,
    created_at datetime(6)                                               default CURRENT_TIMESTAMP(6) not null,
    updated_at datetime(6)                                               default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6)
);

create table users
(
    id         int auto_increment
        primary key,
    name       varchar(255)                                 not null,
    email      varchar(255)                                 not null,
    country    varchar(255)                                 not null,
    password   varchar(255)                                 not null,
    phone      varchar(255)                                 not null,
    gender     enum ('Male', 'Female', 'Prefer not to say') not null,
    imageUrl   varchar(255)                                 null,
    created_at datetime(6) default CURRENT_TIMESTAMP(6)     not null,
    updated_at datetime(6) default CURRENT_TIMESTAMP(6)     not null on update CURRENT_TIMESTAMP(6),
    role_id    int                                          null,
    constraint IDX_97672ac88f789774dd47f7c8be
        unique (email),
    constraint FK_a2cecd1a3531c0b041e29ba46e1
        foreign key (role_id) references roles (id)
);

create table orders
(
    id                  int auto_increment
        primary key,
    status              enum ('pending', 'preparing', 'ready', 'delivered', 'cancelled') default 'pending'            not null,
    totalAmount         decimal(10, 2)                                                                                not null,
    specialInstructions varchar(255)                                                                                  null,
    user_id             int                                                                                           not null,
    table_id            int                                                                                           null,
    coupon_id           int                                                                                           null,
    createdAt           datetime(6)                                                      default CURRENT_TIMESTAMP(6) not null,
    updatedAt           datetime(6)                                                      default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    deletedAt           datetime(6)                                                                                   null,
    orderType           enum ('dine_in', 'takeaway')                                     default 'dine_in'            not null,
    constraint FK_3d36410e89a795172fa6e0dd968
        foreign key (table_id) references tables (id),
    constraint FK_6284f0f60e4cb96c12ff96f0f15
        foreign key (coupon_id) references coupons (id),
    constraint FK_a922b820eeef29ac1c6800e826a
        foreign key (user_id) references users (id)
);

create table order_meal_items
(
    id       int auto_increment
        primary key,
    order_id int                   not null,
    meal_id  int                   null,
    item_id  int                   null,
    type     enum ('meal', 'item') not null,
    quantity int                   not null,
    constraint FK_5fe6337a3d7617f5e1b6a8b1ae0
        foreign key (meal_id) references meals (id),
    constraint FK_856ac897060d2a71e20fd0b3167
        foreign key (order_id) references orders (id),
    constraint FK_f78efa4463e24162b0fd5c11d2f
        foreign key (item_id) references items (id)
);

create table table_reservations
(
    id               int auto_increment
        primary key,
    table_id         int                                                                                  not null,
    user_id          int                                                                                  null,
    customer_name    varchar(255)                                                                         not null,
    customer_email   varchar(255)                                                                         not null,
    customer_phone   varchar(255)                                                                         not null,
    party_size       int                                                                                  not null,
    reservation_date date                                                                                 not null,
    reservation_time time                                                                                 not null,
    special_requests text                                                                                 null,
    status           enum ('pending', 'confirmed', 'cancelled', 'completed') default 'pending'            not null,
    created_at       datetime(6)                                             default CURRENT_TIMESTAMP(6) not null,
    updated_at       datetime(6)                                             default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    constraint FK_0c656fffcec6fdf1bdcddb79b73
        foreign key (user_id) references users (id),
    constraint FK_9dadd651cd5dc1caaf7533d24df
        foreign key (table_id) references tables (id)
);

