DROP DATABASE IF EXISTS `FOS`;
CREATE DATABASE `FOS`;
USE `FOS`;

CREATE TABLE `Users`
(
    `id`            INTEGER PRIMARY KEY AUTO_INCREMENT,
    `name`          VARCHAR(255)                     NOT NULL,
    `email`         VARCHAR(255)                     NOT NULL,
    `role`          ENUM ('customer','admin','chef') NOT NULL,
    `password_hash` CHAR(60)                         NOT NULL
);

CREATE TABLE `Items`
(
    `id`           INTEGER PRIMARY KEY AUTO_INCREMENT,
    `name`         VARCHAR(32)   NOT NULL,
    `description`  VARCHAR(255)  NOT NULL,
    `price`        DECIMAL(6, 2) NOT NULL,
    `is_available` BOOLEAN       NOT NULL,
    `image_url`    VARCHAR(255)  NOT NULL
);

CREATE TABLE `Tags`
(
    `id`   INTEGER PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL
);

CREATE TABLE `ItemTags`
(
    `item_id` INTEGER NOT NULL,
    `tag_id`  INTEGER NOT NULL,
    PRIMARY KEY (`item_id`, `tag_id`)
);

CREATE TABLE `Orders`
(
    `id`           INTEGER PRIMARY KEY AUTO_INCREMENT,
    `ordered_at`   DATETIME                NOT NULL,
    `customer_id`  INTEGER                 NOT NULL,
    `table_number` INTEGER                 NOT NULL,
    `status`       ENUM ('open', 'closed') NOT NULL
);

CREATE TABLE `OrderItems`
(
    `id`                  INTEGER PRIMARY KEY          NOT NULL AUTO_INCREMENT,
    `order_id`            INTEGER                      NOT NULL,
    `item_id`             INTEGER                      NOT NULL,
    `count`               INTEGER                      NOT NULL,
    `status`              ENUM ('pending','completed') NOT NULL,
    `custom_instructions` VARCHAR(255)
);

CREATE TABLE `Sessions`
(
    `id`            INTEGER PRIMARY KEY AUTO_INCREMENT,
    `user_id`       INTEGER     NOT NULL,
    `refresh_token` CHAR(32)    NOT NULL,
    `name`          VARCHAR(32) NOT NULL,
    `created_at`    DATETIME    NOT NULL,
    `last_login`    DATETIME    NOT NULL,
    `revoked`       BOOLEAN     NOT NULL
);

CREATE TABLE `Payments`
(
    `id`             INTEGER PRIMARY KEY AUTO_INCREMENT,
    `user_id`        INTEGER                         NOT NULL,
    `cashier_id`     INTEGER                         NOT NULL,
    `order_id`       INTEGER                         NOT NULL,
    `order_subtotal` DECIMAL                         NOT NULL,
    `tip`            DECIMAL(6, 2)                   NOT NULL,
    `status`         ENUM ('processing','completed') NOT NULL,
    `total`          DECIMAL(6, 2) GENERATED ALWAYS AS (order_subtotal + tip) STORED
);

ALTER TABLE `ItemTags`
    ADD FOREIGN KEY (`item_id`) REFERENCES `Items` (`id`);

ALTER TABLE `ItemTags`
    ADD FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`);

ALTER TABLE `Orders`
    ADD FOREIGN KEY (`customer_id`) REFERENCES `Users` (`id`);

ALTER TABLE `OrderItems`
    ADD FOREIGN KEY (`order_id`) REFERENCES `Orders` (`id`);

ALTER TABLE `OrderItems`
    ADD FOREIGN KEY (`item_id`) REFERENCES `Items` (`id`);

ALTER TABLE `Sessions`
    ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

ALTER TABLE `Payments`
    ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`);

ALTER TABLE `Payments`
    ADD FOREIGN KEY (`cashier_id`) REFERENCES `Users` (`id`);

ALTER TABLE `Payments`
    ADD FOREIGN KEY (`order_id`) REFERENCES `Orders` (`id`);

# create a admin user with password 30358d2619cb
INSERT INTO Users(name, email, role, password_hash) VALUE ('admin', 'admin@fos.com', 'admin', '$2b$10$uf.ZvtsVJMB9Wb2FC4M.AedEfJ3IUlD9p4ln7CdbeDpLJMy7VqHIu')