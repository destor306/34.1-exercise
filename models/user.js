/** User class for message.ly */

const { DB_URI } = require("../config");
const bcrypt = require("bcrypt")
const {BCRYPT_WORK_FACTOR} = require('../config')
const db = require("../db")
/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
      (username, password, first_name, last_name, phone, join_at, last_login_at) 
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone
      `,
      [username, hashedPw, first_name, last_name, phone]
    );
    //console.log(result)
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(`
    SELECT username, password
    FROM users WHERE username = $1`,
    [username])
    const user = result.rows[0]
    if (user){
      if(await bcrypt.compare(password,user.password)){
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    await db.query(`
    UPDATE users
    SET last_login_at = current_timestamp 
    WHERE username =$1`,[ username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users`)
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username=$1`,[username]);
    //console.log(result.rows)
    return result.rows[0];
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`
    SELECT m.id, m.body, m.sent_at, m.read_at,
    u.username, u.first_name, u.last_name, u.phone
    FROM messages m
    JOIN users u
    ON m.to_username = u.username
    WHERE m.from_username=$1
    `, [username])

    return result.rows.map(row=>({
      id: row.id,
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at,
      to_user: {
        username : row.username,
        first_name : row.first_name,
        last_name : row.last_name,
        phone : row.phone
      }
    }));
   };

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`
    SELECT m.id, m.body, m.sent_at, m.read_at,
    u.username, u.first_name, u.last_name, u.phone
    FROM messages m
    JOIN users u
    ON m.from_username = u.username
    WHERE m.to_username=$1
    `, [username])

    return result.rows.map(row=>({
      id: row.id,
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at,
      from_user: {
        username : row.username,
        first_name : row.first_name,
        last_name : row.last_name,
        phone : row.phone
      }
    }));
   }
}


module.exports = User;