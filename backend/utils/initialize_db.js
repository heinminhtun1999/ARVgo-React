async function initializeDB(sql) {
    try {

        await sql`CREATE TABLE IF NOT EXISTS albums
                  (
                      id INTEGER PRIMARY KEY,
                      name TEXT NOT NULL,
                      created_at TIMESTAMP NOT NULL
                  )`

        await sql`CREATE TABLE IF NOT EXISTS posts
                  (
                      id INTEGER PRIMARY KEY,
                      title TEXT NOT NULL,
                      description TEXT NOT NULL,
                      event_date TIMESTAMP,
                      created_at TIMESTAMP NOT NULL,
                      updated_at TIMESTAMP NOT NULL,
                      album_id INTEGER,
                      CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
                  )`

        await sql`CREATE TABLE IF NOT EXISTS images 
              (
                  id   INTEGER PRIMARY KEY,
                  url  TEXT NOT NULL,
                  album_id INTEGER,
                  post_id INTEGER,
                  created_at TIMESTAMP NOT NULL,
                  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
                  CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
              )`

        await sql`CREATE TABLE IF NOT EXISTS videos 
              (
                  id   INTEGER PRIMARY KEY,
                  title TEXT NOT NULL,
                  description TEXT NOT NULL,
                  url  TEXT NOT NULL,
                  embed_code TEXT NOT NULL,
                  privacy TEXT NOT NULL,
                  album_id INTEGER,
                  post_id INTEGER,
                  event_date TIMESTAMP,
                  created_at TIMESTAMP NOT NULL,
                  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
                  CONSTRAINT fk_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
              )`

        await sql`CREATE TABLE IF NOT EXISTS agreement_files
                  (
                      id INTEGER PRIMARY KEY,
                      name VARCHAR(255) NOT NULL,
                      url  TEXT NOT NULL,
                      created_at TIMESTAMP NOT NULL
                  )`

        console.log("-".repeat(50) + "\n".repeat(5));
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = initializeDB;