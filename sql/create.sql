\ir ./drop.sql

-- CREATE SEQUENCE app_user_s START WITH 1000 INCREMENT BY 1;
CREATE TABLE app_user (
    -- id bigint NOT NULL UNIQUE DEFAULT nextval('app_user_s'),
    email_id text PRIMARY KEY,
    name text NULL
);

CREATE SEQUENCE app_group_s START WITH 1000 INCREMENT BY 1;
CREATE TABLE app_group (
    id bigint PRIMARY KEY DEFAULT nextval('app_group_s'),
    name text NOT NULL,
    description text NULL
);

CREATE TABLE group_membership (
    group_id bigint NOT NULL REFERENCES app_group(id) ON DELETE CASCADE,
    member_email_id text NOT NULL REFERENCES app_user(email_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, member_email_id)
);

CREATE TABLE assignment (
    group_id bigint NOT NULL REFERENCES app_group(id) ON DELETE CASCADE,
    member_email_id text NOT NULL REFERENCES app_user(email_id) ON DELETE CASCADE,
    assignment_email_id text NOT NULL REFERENCES app_user(email_id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, member_email_id)
);

CREATE SEQUENCE item_s START WITH 1000 INCREMENT BY 1;
CREATE TABLE item (
    id bigint PRIMARY KEY DEFAULT nextval('item_s'),
    member_email_id text NOT NULL REFERENCES app_user(email_id) ON DELETE CASCADE,
    group_id bigint NULL REFERENCES app_group(id),
    title text NOT NULL,
    link text,
    description text,
    purchased boolean DEFAULT FALSE
);