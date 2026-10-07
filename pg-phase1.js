LH.L['postgresql:1:1']=[
{t:'h',s:1,x:'1. What PostgreSQL is'},
{t:'p',x:'PostgreSQL ("Postgres") is a free, open-source <b>object-relational database management system</b>. It stores data in tables, speaks SQL, and is fully <b>ACID</b> compliant. It is released under the permissive <b>PostgreSQL License</b> (BSD-like), so there are no per-core fees, no edition tiers and no vendor lock-in.'},
{t:'tbl',h:['Year','Milestone'],r:[['1986','POSTGRES project starts at UC Berkeley (Michael Stonebraker), successor to Ingres'],['1995','Postgres95: SQL replaces the original PostQUEL language'],['1996','Renamed PostgreSQL; open-source community development begins'],['Today','One major release every year, each supported for 5 years; minor releases (bug and security fixes) several times a year']]},
{t:'h',x:'Why DBAs choose it'},
{t:'list',i:['<b>Standards and correctness:</b> strong SQL compliance, transactional DDL (you can roll back <code>CREATE TABLE</code>).','<b>Rich types:</b> JSONB, arrays, ranges, UUID, enums, geometric types, and custom types.','<b>Extensible:</b> add features without forking, e.g. PostGIS (maps), pg_cron (scheduling), pg_stat_statements (query stats).','<b>Concurrency:</b> MVCC means readers never block writers and writers never block readers.','<b>Many index types:</b> B-tree, Hash, GIN, GiST, SP-GiST, BRIN.','<b>Replication built in:</b> physical streaming and logical replication.']},
{t:'ex',x:'Instagram, Apple, Reddit-scale products and countless banks and governments run on PostgreSQL. A typical startup runs the whole product (users, orders, JSON events, geo search) on one Postgres instead of four separate databases.'},
{t:'h',s:1,x:'2. Client/server architecture'},
{t:'p',x:'PostgreSQL is a <b>client/server</b> system. Your application never touches data files directly. It sends SQL over TCP (default port <b>5432</b>) or a Unix socket to the server, which does all the work and returns rows.'},
{t:'svg',x:`<svg viewBox="0 0 700 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PostgreSQL architecture"><g><rect x="20" y="8" width="660" height="40" rx="10"/><text x="350" y="33" text-anchor="middle">Clients: psql, applications, pgAdmin, DBeaver, BI tools</text></g><g><rect x="20" y="72" width="200" height="62" rx="10"/><text x="120" y="98" text-anchor="middle">postmaster</text><text class="s" x="120" y="118" text-anchor="middle">listens on 5432, forks</text></g><g><rect x="260" y="72" width="420" height="62" rx="10"/><text x="470" y="98" text-anchor="middle">Backend processes (one per connection)</text><text class="s" x="470" y="118" text-anchor="middle">parse, plan, execute</text></g><g><rect x="20" y="160" width="200" height="74" rx="10"/><text x="120" y="184" text-anchor="middle">Background processes</text><text class="s" x="120" y="202" text-anchor="middle">checkpointer, bgwriter, WAL writer</text><text class="s" x="120" y="218" text-anchor="middle">autovacuum, archiver</text></g><g class="m"><rect x="260" y="160" width="420" height="74" rx="10"/><text x="470" y="188" text-anchor="middle">Shared memory</text><text class="s" x="470" y="208" text-anchor="middle">shared_buffers, WAL buffers, lock tables, commit status</text></g><g class="d"><rect x="20" y="262" width="660" height="56" rx="10"/><text x="350" y="286" text-anchor="middle">Disk: PGDATA (base/, global/, pg_wal/, pg_xact/) + WAL archive</text><text class="s" x="350" y="304" text-anchor="middle">tables, indexes, transaction log, config files</text></g><path d="M120 48V72M220 103H260M470 134V160M220 197H260M470 234V262M120 234V262"/></svg>`},
{t:'tip',x:'<b>Vocabulary:</b> a PostgreSQL <b>cluster</b> is one running server instance managing one data directory (<b>PGDATA</b>) with many databases inside. It does not mean multiple servers.'},
{t:'h',s:1,x:'3. The processes'},
{t:'p',x:'Unlike Oracle on Windows or MySQL, PostgreSQL is <b>process-based</b>, not thread-based. Run <code>ps -ef | grep postgres</code> and you will see each one.'},
{t:'tbl',h:['Process','Job','Oracle analogy'],r:[
['postmaster','Parent of all. Accepts connections, authenticates, forks backends, restarts everything after a crash','Listener + PMON'],
['backend (postgres: user db host state)','Serves exactly one client session','Dedicated server process'],
['checkpointer','At each checkpoint writes all dirty buffers to disk and records a recovery start point','CKPT + DBWR'],
['background writer','Trickles out dirty buffers so backends rarely wait to evict one','DBWR'],
['WAL writer','Flushes WAL buffers to pg_wal in the background','LGWR'],
['autovacuum launcher + workers','Remove dead rows, freeze old XIDs, refresh planner statistics','No direct match'],
['archiver','Copies finished WAL files to the archive (if archiving is on)','ARCn'],
['walsender / walreceiver','Stream WAL to and from replicas','Data Guard transport'],
['logical replication launcher / workers','Run publications and subscriptions','GoldenGate-like']]},
{t:'warn',x:'Old books mention a <b>stats collector</b> process. It was removed in PostgreSQL 15; statistics now live in shared memory.'},
{t:'h',s:1,x:'4. Life of a connection, and why pooling matters'},
{t:'flow',s:['Client opens TCP connection to port 5432','Postmaster checks pg_hba.conf: is this host/user/database allowed, and which auth method?','Authentication (scram-sha-256, certificate, LDAP...)','Postmaster forks a new backend process','Backend attaches to shared memory and runs queries','Client disconnects: backend exits and frees memory']},
{t:'p',x:'Forking a process per connection is simple and isolates crashes, but each backend costs memory and start-up time. <code>max_connections</code> defaults to 100. Setting it to 2000 does not make the server faster; it makes it slower.'},
{t:'ex',x:'An e-commerce site runs 60 app pods, each with a pool of 20 connections = 1,200 connections. Postgres on 16 cores spends its time context-switching. Fix: put <b>PgBouncer</b> in front in transaction-pooling mode, so 1,200 client connections share about 50 real backends.'},
{t:'h',s:1,x:'5. Memory: shared and private'},
{t:'cmp',a:['Shared (one copy, all backends)',['<code>shared_buffers</code>: page cache, default 128MB, often 25% of RAM on a dedicated server','<code>wal_buffers</code>: WAL not yet flushed','Lock tables, commit-status cache, proc array']],b:['Private (per backend)',['<code>work_mem</code>: each sort or hash step, default 4MB','<code>maintenance_work_mem</code>: VACUUM, CREATE INDEX','<code>temp_buffers</code>: temporary tables','Parser and planner memory']]},
{t:'p',x:'PostgreSQL also relies on the <b>operating system page cache</b>. Data is often cached twice (shared_buffers and OS cache), which is why you do not give Postgres 90% of RAM. The planner setting <code>effective_cache_size</code> only tells the planner how much total cache to expect; it allocates nothing.'},
{t:'warn',x:'<b>work_mem trap:</b> 64MB x 3 sort/hash nodes in a query x 100 active sessions = about 19GB. Size it for peak concurrency, not for one query. Raise it per session (<code>SET work_mem</code>) for known heavy reports.'},
{t:'h',s:1,x:'6. How data is stored on disk'},
{t:'list',i:['Every table and index is stored in one or more <b>files</b> under <code>PGDATA/base/&lt;db oid&gt;/</code>, named by a number (<b>relfilenode</b>), split into 1GB segments.','Files are made of <b>8KB pages</b> (blocks). A page holds a header, an array of item pointers, free space, and the <b>tuples</b> (rows).','Extra "forks" per table: <code>_fsm</code> (free space map) and <code>_vm</code> (visibility map).','Values over about 2KB are compressed and/or moved out of line to a <b>TOAST</b> table.','Tables are <b>heaps</b>: rows are not stored in key order. Indexes point to rows by <b>ctid</b> (page number, slot).']},
{t:'tip',x:'<b>Oracle view:</b> there are no datafiles holding many tables and no tablespace you must pre-size. Each table is its own file and the filesystem grows as needed. There is no undo tablespace either; old row versions stay in the table itself (next section).'},
{t:'h',s:1,x:'7. MVCC: why UPDATE is really INSERT'},
{t:'p',x:'PostgreSQL never overwrites a row in place. An <code>UPDATE</code> writes a <b>new row version</b> and marks the old one as ended. Each version carries <code>xmin</code> (transaction that created it) and <code>xmax</code> (transaction that deleted or replaced it). Each query sees a snapshot and picks the versions visible to it.'},
{t:'tbl',h:['Step','Row versions in the table page'],r:[['INSERT balance=100 (txid 500)','v1: xmin=500, xmax=0, balance 100'],['UPDATE balance=80 (txid 510)','v1: xmin=500, xmax=510 (dead after 510 commits)<br>v2: xmin=510, xmax=0, balance 80'],['Reader that started before 510 commits','Still sees v1'],['VACUUM later','Removes v1 and reuses its space']]},
{t:'ex',x:'A busy orders table is updated 10,000 times per minute. Without autovacuum the dead versions pile up (<b>bloat</b>): the table grows, scans slow down, and eventually transaction IDs can approach wraparound. This is the number one operational topic for a Postgres DBA, covered in Phase 4.'},
{t:'h',s:1,x:'8. WAL, checkpoints and crash recovery'},
{t:'p',x:'The <b>Write-Ahead Log</b> is a sequential journal of every change, stored in <code>pg_wal/</code> in 16MB segment files. Rule: <b>the log reaches disk before the data page does</b>. Sequential WAL writes are cheap; random data-page writes can wait.'},
{t:'flow',s:['Backend changes a page in shared_buffers (page is now dirty)','Backend writes a WAL record into WAL buffers','COMMIT: WAL flushed to disk (fsync)','Client gets "COMMIT" and the data is safe','Later: bgwriter and checkpointer write the dirty page to the data file','Old WAL is recycled or archived once no longer needed']},
{t:'h',x:'Checkpoints'},
{t:'p',x:'A <b>checkpoint</b> forces all dirty pages out to disk and records the WAL position. It starts every <code>checkpoint_timeout</code> (default 5 min) or when WAL reaches <code>max_wal_size</code> (default 1GB). After a crash, Postgres replays WAL <b>from the last checkpoint</b> and the database is consistent again with no DBA action.'},
{t:'ex',x:'Power fails at 14:03:10 while 200 transactions are mid-flight. On restart the postmaster sees the crash, replays WAL from the last checkpoint, keeps all committed transactions and discards uncommitted ones. Total downtime is seconds to minutes depending on WAL volume since the checkpoint.'},
{t:'warn',x:'Never set <code>fsync=off</code> on a real system. A crash can then corrupt the whole cluster. <code>synchronous_commit=off</code> is the safe way to trade up to a fraction of a second of recent commits for speed; it cannot corrupt data.'},
{t:'h',s:1,x:'9. Life of a query'},
{t:'flow',s:['Parser: checks syntax, builds a parse tree','Analyzer: resolves tables, columns and types using the catalog','Rewriter: expands views and rules','Planner/optimizer: picks the cheapest plan using statistics (seq scan or index, join order)','Executor: runs the plan, reads pages via shared_buffers, returns rows']},
{t:'tip',x:'See the chosen plan with <code>EXPLAIN</code>. Bad plans are almost always caused by stale statistics or missing indexes (Phase 5).'},
{t:'h',s:1,x:'10. Oracle to PostgreSQL cheat sheet'},
{t:'tbl',h:['Oracle','PostgreSQL'],r:[['Instance + database','Cluster (server) containing many databases'],['SGA','shared_buffers + other shared memory'],['PGA','work_mem and backend-private memory'],['Redo logs / archived logs','WAL / archived WAL'],['Undo tablespace','None: old versions in the table, cleaned by VACUUM'],['Schema = user','Schema is a namespace inside a database; users are separate roles'],['Listener (tnsnames)','postmaster + pg_hba.conf'],['SPFILE / init.ora','postgresql.conf and postgresql.auto.conf'],['RMAN','pg_basebackup, pgBackRest, Barman'],['Data Guard','Streaming replication']]},
{t:'h',s:1,x:'11. Hands-on lab'},
{t:'p',x:'Try these on any test server (a local install or Docker container is ideal).'},
{t:'steps',i:['<b>See the processes.</b> Run the first command below and identify the postmaster, checkpointer, background writer, WAL writer and autovacuum launcher.','<b>Find your backend.</b> Run <code>SELECT pg_backend_pid();</code> in psql, then find that PID in the <code>ps</code> output.','<b>Inspect sessions.</b> Query <code>pg_stat_activity</code> and notice the <code>backend_type</code> column.','<b>Check memory settings</b> with <code>SHOW</code>.','<b>Find your table on disk</b> with <code>pg_relation_filepath</code>.','<b>Watch MVCC.</b> Update a row and compare <code>xmin</code> and <code>ctid</code> before and after.']},
{t:'code',x:`# 1. Linux shell
ps -ef | grep postgres

-- 2-5. inside psql
SELECT pg_backend_pid();
SELECT pid, backend_type, state, query FROM pg_stat_activity;
SHOW shared_buffers;  SHOW work_mem;  SHOW max_connections;
SHOW data_directory;
CREATE TABLE demo(id int, bal int);
INSERT INTO demo VALUES (1,100);
SELECT pg_relation_filepath('demo');

-- 6. MVCC in action
SELECT ctid, xmin, xmax, * FROM demo;
UPDATE demo SET bal = 80 WHERE id = 1;
SELECT ctid, xmin, xmax, * FROM demo;   -- new ctid, new xmin
SELECT * FROM pg_stat_wal;`},
{t:'p',x:'From PostgreSQL 17, checkpoint counters are in <b>pg_stat_checkpointer</b>; before that they were in <code>pg_stat_bgwriter</code>.'},
{t:'h',s:1,x:'12. Common beginner mistakes'},
{t:'list',i:['Raising <code>max_connections</code> instead of adding a pooler.','Setting <code>work_mem</code> globally to a huge value.','Disabling autovacuum "because it uses I/O", then fighting bloat later.','Assuming the cluster is multiple servers, or that a database equals a schema.','Deleting files in <code>pg_wal</code> to free space. This can destroy the cluster. Fix the cause (stuck replication slot, failing archive command) instead.','Treating <code>kill -9</code> on a backend as harmless: it forces the postmaster to restart all sessions.']},
{t:'h',s:1,x:'13. Check yourself'},
{t:'qa',q:'Why does PostgreSQL commit quickly even though data files are written later?',x:'Commit only needs the sequential WAL flush. Data pages are written lazily by the bgwriter and checkpointer, and WAL replay covers any gap after a crash.'},
{t:'qa',q:'A table has 1 million rows but takes 5GB. Which concept explains this?',x:'Bloat from dead row versions (MVCC). Updates and deletes leave old versions until VACUUM reclaims them.'},
{t:'qa',q:'Your app needs 3,000 connections. What do you do?',x:'Add a pooler such as PgBouncer and keep max_connections modest. Each backend is a full OS process.'},
{t:'h',s:1,x:'Key takeaways'},
{t:'list',i:['One cluster = one postmaster + background processes + shared memory + one PGDATA.','One backend process per connection, so pool connections.','Rows are 8KB-page heap tuples; UPDATE creates a new version (MVCC) and VACUUM cleans the old.','WAL is written before data pages: this gives durability and fast crash recovery.','shared_buffers is shared; work_mem is per operation per backend.','Next topic: installation, initdb, and cluster vs database vs schema.']}];
LH.Q['postgresql:1']=[
{q:'What does the postmaster do when a client connects?',o:['Runs the query itself','Forks a backend process for that connection','Writes the WAL','Starts autovacuum'],a:1,e:'The postmaster authenticates and forks one backend per connection.'},
{q:'Which process is closest to Oracle LGWR?',o:['checkpointer','bgwriter','WAL writer','archiver'],a:2,e:'The WAL writer flushes WAL like LGWR flushes redo.'},
{q:'When is a commit durable?',o:['When the dirty page reaches the data file','When the WAL is flushed to disk','At the next checkpoint','At the next vacuum'],a:1,e:'WAL is flushed at commit. Data files catch up later.'},
{q:'Why is a very high work_mem risky?',o:['It is shared by all sessions','It is allocated per sort/hash operation per backend','It disables caching','It slows WAL'],a:1,e:'Many sessions each using it several times can exhaust RAM.'},
{q:'What does an UPDATE do internally?',o:['Overwrites the row in place','Writes a new row version and ends the old one','Moves the row to undo','Locks the table'],a:1,e:'MVCC creates a new tuple version; VACUUM removes the old one later.'},
{q:'What is the page size of a PostgreSQL table file by default?',o:['2KB','4KB','8KB','16MB'],a:2,e:'Heap files are made of 8KB pages. 16MB is the WAL segment size.'},
{q:'After a crash, where does recovery start replaying WAL?',o:['From the first WAL file ever','From the last checkpoint','From the last vacuum','From the last backup'],a:1,e:'Checkpoints bound recovery time.'},
{q:'Best fix for thousands of application connections?',o:['Raise max_connections to 5000','Use a pooler like PgBouncer','Raise shared_buffers','Disable autovacuum'],a:1,e:'Each connection is an OS process; pooling keeps the real count low.'}];
