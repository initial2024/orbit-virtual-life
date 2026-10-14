-- DESIGN ONLY — NOT DEPLOYED. Stage 16 compact D1 schema.
PRAGMA foreign_keys = ON;
CREATE TABLE world_players (player_id TEXT PRIMARY KEY,account_id TEXT NOT NULL UNIQUE,profile_json TEXT NOT NULL DEFAULT '{}',version INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE world_wallets (player_id TEXT NOT NULL REFERENCES world_players(player_id),currency TEXT NOT NULL,balance_minor INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(player_id,currency));
CREATE TABLE world_ledger (entry_id TEXT PRIMARY KEY,transaction_id TEXT NOT NULL,player_id TEXT,account_kind TEXT NOT NULL,account_ref TEXT NOT NULL,currency TEXT NOT NULL,amount_minor INTEGER NOT NULL,category TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX world_ledger_tx ON world_ledger(transaction_id);
CREATE INDEX world_ledger_player_time ON world_ledger(player_id,created_at DESC);
CREATE TABLE world_business (entity_id TEXT PRIMARY KEY,entity_type TEXT NOT NULL CHECK(entity_type IN ('company','store','job_post','company_member')),owner_player_id TEXT,parent_id TEXT,region TEXT,status TEXT NOT NULL,indexed_kind TEXT,reputation_milli INTEGER NOT NULL DEFAULT 50000,payload_json TEXT NOT NULL DEFAULT '{}',version INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL);
CREATE INDEX world_business_owner ON world_business(owner_player_id,entity_type,status);
CREATE INDEX world_business_region ON world_business(region,entity_type,indexed_kind,status);
CREATE TABLE world_inventory (store_id TEXT NOT NULL,sku TEXT NOT NULL,variant_id TEXT NOT NULL DEFAULT 'default',available_qty INTEGER NOT NULL,reserved_qty INTEGER NOT NULL DEFAULT 0,price_minor INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL,PRIMARY KEY(store_id,sku,variant_id));
CREATE INDEX world_inventory_sku ON world_inventory(sku,store_id);
CREATE TABLE world_orders (order_id TEXT PRIMARY KEY,buyer_player_id TEXT NOT NULL,seller_entity_id TEXT NOT NULL,status TEXT NOT NULL,currency TEXT NOT NULL,total_minor INTEGER NOT NULL,lines_json TEXT NOT NULL,merchant_generation INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE INDEX world_orders_buyer ON world_orders(buyer_player_id,created_at DESC);
CREATE INDEX world_orders_seller ON world_orders(seller_entity_id,created_at DESC);
CREATE TABLE world_social (content_id TEXT PRIMARY KEY,content_type TEXT NOT NULL CHECK(content_type IN ('comment','review','reaction','company_announcement')),author_player_id TEXT NOT NULL,target_type TEXT NOT NULL,target_id TEXT NOT NULL,score INTEGER,body TEXT NOT NULL DEFAULT '',metadata_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'visible',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE INDEX world_social_target ON world_social(target_type,target_id,status,created_at DESC);
CREATE TABLE world_market (region TEXT NOT NULL,sku TEXT NOT NULL,period_key TEXT NOT NULL,player_demand INTEGER NOT NULL DEFAULT 0,player_supply INTEGER NOT NULL DEFAULT 0,synthetic_demand INTEGER NOT NULL DEFAULT 0,reference_price_minor INTEGER NOT NULL,stats_json TEXT NOT NULL DEFAULT '{}',updated_at INTEGER NOT NULL,PRIMARY KEY(region,sku,period_key));
CREATE TABLE world_idempotency (account_id TEXT NOT NULL,game_id TEXT NOT NULL,client_nonce TEXT NOT NULL,response_digest TEXT NOT NULL,committed_revision INTEGER NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(account_id,game_id,client_nonce));
