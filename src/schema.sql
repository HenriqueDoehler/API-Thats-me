


CREATE TABLE company (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  cnpj varchar(14) UNIQUE,
  adress varchar(255),
  state varchar(255),
  sector varchar(255),
  cep varchar(8),
  email varchar(255) NOT NULL,
  phone varchar(15),
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE company_admin (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(20),
  created_at timestamptz DEFAULT NOW(),
  company_id integer REFERENCES company(id) ON DELETE CASCADE
);

CREATE TABLE admin (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255)NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE events (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  company_id integer REFERENCES company(id),
  description varchar(10000),
  data date,
  address varchar(255),
  time time,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE event_user (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20),
  event_id integer REFERENCES events(id),
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE event_medals (
  id serial PRIMARY KEY,
  cod_model varchar(500) NOT NULL,
  short_code varchar(10),
  event_id int NOT NULL,
  position varchar(30),
  created_at timestamptz DEFAULT NOW(),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE password_reset (
  id serial PRIMARY KEY,
  admin_id integer NOT NULL REFERENCES admin(id),
  code varchar(6) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE wallet (
  id serial PRIMARY KEY,
  event_id int NOT NULL,
  medal_id int NOT NULL,
  email varchar(255) NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (medal_id) REFERENCES event_medals(id)
);


CREATE EXTENSION pgcrypto;

CREATE OR REPLACE FUNCTION to_base64(text) RETURNS text AS $$
  SELECT encode($1::bytea, 'base64')
$$ LANGUAGE SQL IMMUTABLE STRICT;


CREATE OR REPLACE FUNCTION generate_short_code_1()
RETURNS TRIGGER AS $$
DECLARE
    short_code text;
BEGIN
    short_code := substring(md5(random()::text || clock_timestamp()::text), 1, 5);
    NEW.short_code := short_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER tr_generate_short_code_1
BEFORE INSERT ON event_medals
FOR EACH ROW
EXECUTE FUNCTION generate_short_code_1();


DROP TRIGGER IF EXISTS tr_add_medal_to_wallet ON wallet;
DROP FUNCTION IF EXISTS add_medal_to_wallet();


CREATE OR REPLACE FUNCTION add_medal_to_wallet() RETURNS TRIGGER AS $$
DECLARE
  medal_max_uses integer;
  event_medal event_medals%ROWTYPE;
BEGIN
  SELECT * INTO event_medal FROM event_medals WHERE id = NEW.medal_id FOR UPDATE;

  medal_max_uses := event_medal.max_uses;

  IF medal_max_uses IS NOT NULL THEN
  
    IF EXISTS (
      SELECT 1 FROM wallet WHERE medal_id = NEW.medal_id GROUP BY medal_id HAVING COUNT(*) >= medal_max_uses
    ) THEN
      RAISE EXCEPTION 'Medalha esgotada', NEW.medal_id, medal_max_uses;
      ELSE
      
      UPDATE event_medals SET max_uses = max_uses - 1 WHERE id = NEW.medal_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER tr_add_medal_to_wallet
  BEFORE INSERT ON wallet
  FOR EACH ROW
  EXECUTE FUNCTION add_medal_to_wallet();
