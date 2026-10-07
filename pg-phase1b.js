LH.L['postgresql:1:2']=[
{t:'h',s:1,x:'1. Ways to install'},
{t:'tbl',h:['Method','Best for','Notes'],r:[
['PGDG apt/yum repository','Servers, production','Official packages; any supported major version, quick security fixes'],
['Distro default package','Quick tests','Often an older major version'],
['Docker image <code>postgres</code>','Dev, CI, demos','Keep data on a volume, or it disappears with the container'],
['Windows / macOS installer','Laptops','Wizard; bundles pgAdmin'],
['Source build','Custom builds','You handle compilers and upgrades'],
['Managed cloud (RDS, Azure, Cloud SQL)','Teams that do not want to run servers','Provider runs initdb for you; no OS access']]},
{t:'cmp',a:['Debian / Ubuntu',['<code>apt install postgresql-17</code> installs <b>and</b> creates a cluster named <code>main</code>','Manage with <code>pg_lsclusters</code>, <code>pg_ctlcluster</code>, <code>systemctl</code>','Several clusters per host are easy']],b:['RHEL / Rocky / Alma',['<code>dnf install postgresql17-server</code> installs only the software','You must run <code>/usr/pgsql-17/bin/postgresql-17-setup initdb</code>','Then <code>systemctl enable --now postgresql-17</code>']]},
{t:'tip',x:'Use the version you actually need in place of 17. Major versions install side by side, which makes upgrade testing easy.'},
{t:'h',s:1,x:'2. initdb: creating a cluster'},
{t:'p',x:'<code>initdb</code> turns an empty directory into a working <b>cluster</b>. It runs once, as the <code>postgres</code> OS user (never root).'},
{t:'flow',s:['Create empty PGDATA directory, owner postgres, mode 0700','initdb creates sub-directories (base, global, pg_wal...)','Builds template1, then copies it to template0 and postgres','Writes postgresql.conf, pg_hba.conf, pg_ident.conf, PG_VERSION','Prints "Success"; start the server with pg_ctl or systemctl']},
{t:'tbl',h:['Option','Meaning'],r:[['<code>-D</code>','Data directory (or set PGDATA)'],['<code>-E UTF8</code>','Default encoding for new databases'],['<code>--locale</code>','Sorting and formatting rules'],['<code>--data-checksums</code>','Detect silent disk corruption. Recommended; on by default from PostgreSQL 18'],['<code>--wal-segsize</code>','WAL file size (default 16MB)'],['<code>--auth-local / --auth-host</code>','Initial pg_hba.conf methods. Avoid trust']]},
{t:'warn',x:'Choose <b>encoding and locale</b> carefully at initdb time. Changing sorting rules later can silently corrupt indexes, and fixing it means dump and restore.'},
{t:'code',x:`sudo -u postgres /usr/pgsql-17/bin/initdb -D /pgdata/17 -E UTF8 --data-checksums
pg_ctl -D /pgdata/17 -l logfile start
pg_ctl -D /pgdata/17 status`},
{t:'h',x:'Stopping: three modes'},
{t:'tbl',h:['Mode','Behaviour','Use when'],r:[['smart','Waits for all sessions to disconnect','Rarely; can wait forever'],['fast (default)','Rolls back sessions, checkpoints, shuts down cleanly','Normal restarts'],['immediate','Aborts like a crash; recovery runs on next start','Emergencies only']]},
{t:'chk',q:'You ran initdb on a directory that already holds files. What happens?',o:['It merges the files','It refuses: the directory must be empty','It deletes everything','It only warns'],a:1,e:'initdb needs an empty (or new) directory.'},
{t:'h',s:1,x:'3. Cluster vs database vs schema'},
{t:'arch',g:[['Cluster: one server, one PGDATA, one port',['Roles (global)','Tablespaces (global)','pg_hba.conf']],['Database: appdb',['schema public','schema sales','schema hr']],['Schema: sales',['tables','views','functions','sequences','types']],['Created by initdb in every cluster',['template0 (pristine)','template1 (copied for new databases)','postgres (default admin DB)']]]},
{t:'tbl',h:['Level','Key rules'],r:[['Cluster','One postmaster and port. Roles (users) and tablespaces are shared by all its databases'],['Database','A connection is bound to <b>one</b> database. A query cannot join across databases without postgres_fdw or dblink'],['Schema','Namespace inside a database. Objects are found via <code>search_path</code>. Cross-schema joins are normal'],['Object','Table, index, view, function, sequence: always lives in exactly one schema']]},
{t:'tip',x:'<b>Oracle view:</b> an Oracle schema is a user. In PostgreSQL a schema is only a folder; users (roles) are separate and cluster-wide. Oracle instance is roughly a cluster; an Oracle PDB is roughly a database.'},
{t:'h',x:'Multi-tenant design choices'},
{t:'ex',x:'A SaaS product has 300 customers. Choosing the layout is a DBA decision.'},
{t:'tbl',h:['Layout','Pros','Cons'],r:[['Database per tenant','Strongest isolation, easy per-tenant backup','Many connections, no cross-tenant queries, heavy at 1000s'],['Schema per tenant','Good isolation, one connection pool','Migrations run N times; catalog grows'],['Shared tables + tenant_id (+ row-level security)','Simplest, scales to many tenants','Isolation depends on correct policies']]},
{t:'h',s:1,x:'4. Hands-on lab'},
{t:'steps',i:['Connect: <code>psql -U postgres</code>.','List databases with <code>\\l</code> and notice template0, template1, postgres.','Create a database and switch into it.','Create a schema and a table inside it.','Show where objects live and how search_path finds them.']},
{t:'code',x:`CREATE DATABASE appdb;
\\c appdb
CREATE SCHEMA sales;
CREATE TABLE sales.orders(id int, total numeric);
\\dn
\\dt sales.*
SHOW search_path;
SET search_path = sales, public;
SELECT * FROM orders;   -- found via search_path
SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;`},
{t:'warn',x:'Do not build real tables in the <code>postgres</code> database or in <code>public</code> of template1: every new database inherits template1 contents.'},
{t:'h',s:1,x:'Key takeaways'},
{t:'chk',q:'Which of these is shared by every database in a cluster?',o:['Schemas','Tables','Roles','search_path'],a:2,e:'Roles and tablespaces are cluster-wide.'},
{t:'list',i:['Install from PGDG packages; Debian creates a cluster for you, RHEL needs initdb.','initdb runs once on an empty directory; pick encoding, locale and checksums up front.','Stop with fast mode normally; immediate means crash recovery.','Cluster contains databases; database contains schemas; schema contains objects.','One connection talks to one database.']}];

LH.L['postgresql:1:3']=[
{t:'h',s:1,x:'1. Connecting with psql'},
{t:'p',x:'<b>psql</b> is the official command-line client. It ships with every install and is the tool you will use on servers where no GUI exists.'},
{t:'code',x:`psql -h db1.example.com -p 5432 -U app_user -d appdb
psql "postgresql://app_user@db1.example.com:5432/appdb?sslmode=require"
sudo -u postgres psql          # local admin via peer authentication`},
{t:'tbl',h:['Setting','Environment variable','Purpose'],r:[['-h','PGHOST','Server host or socket directory'],['-p','PGPORT','Port'],['-U','PGUSER','Role name'],['-d','PGDATABASE','Database'],['(none)','PGPASSWORD','Avoid; visible in process environment']]},
{t:'tip',x:'Store passwords in <code>~/.pgpass</code> as <code>host:port:db:user:password</code> and run <code>chmod 600 ~/.pgpass</code>. psql ignores it if permissions are looser.'},
{t:'h',s:1,x:'2. Meta-commands'},
{t:'p',x:'Commands that start with a backslash are handled by psql itself, not the server. They need no semicolon.'},
{t:'tbl',h:['Command','Shows or does'],r:[['<code>\\l</code>','List databases'],['<code>\\c db</code>','Connect to another database'],['<code>\\dn</code>','List schemas'],['<code>\\dt</code> / <code>\\dt sales.*</code>','List tables'],['<code>\\d table</code> / <code>\\d+ table</code>','Describe columns, indexes, constraints; + adds size and storage'],['<code>\\di \\dv \\ds</code>','Indexes, views, sequences'],['<code>\\df</code>','Functions'],['<code>\\du</code>','Roles'],['<code>\\dx</code>','Installed extensions'],['<code>\\conninfo</code>','Current connection'],['<code>\\? \\h CREATE INDEX</code>','Help for meta-commands and SQL syntax'],['<code>\\q</code>','Quit']]},
{t:'chk',q:'Which command describes a table and its indexes?',o:['\\l','\\d tablename','\\du','\\c'],a:1,e:'\\d lists columns, indexes and constraints.'},
{t:'h',s:1,x:'3. Working faster'},
{t:'tbl',h:['Feature','How','Why'],r:[['Expanded output','<code>\\x auto</code>','Wide rows print vertically'],['Timing','<code>\\timing</code>','Shows elapsed ms per statement'],['Edit last query','<code>\\e</code>','Opens your editor'],['Repeat','<code>SELECT now() \\watch 2</code>','Re-runs every 2 seconds'],['See hidden SQL','<code>\\set ECHO_HIDDEN on</code>','Prints the catalog query behind each \\d command; great for learning'],['Variables','<code>\\set tbl orders</code> then <code>:tbl</code>','Reuse values'],['Generate and run SQL','<code>\\gexec</code>','Runs each result row as a statement']]},
{t:'code',x:`-- ~/.psqlrc
\\set QUIET 1
\\x auto
\\timing on
\\pset null '(null)'
\\set HISTSIZE 5000
\\unset QUIET

-- generate and run one VACUUM per table
SELECT format('VACUUM ANALYZE %I.%I', schemaname, tablename)
FROM pg_tables WHERE schemaname = 'sales' \\gexec`},
{t:'h',s:1,x:'4. Scripting with psql'},
{t:'tbl',h:['Flag','Meaning'],r:[['<code>-c "SQL"</code>','Run one command and exit'],['<code>-f file.sql</code>','Run a script'],['<code>-v name=value</code>','Pass a variable (use :name in the script)'],['<code>-At</code>','Unaligned, tuples only: clean output for scripts'],['<code>-1</code>','Run the whole script in a single transaction'],['<code>-v ON_ERROR_STOP=1</code>','Stop at the first error instead of continuing']]},
{t:'ex',x:'A cron job exports yesterday sales every night: <code>psql -At -v ON_ERROR_STOP=1 -d appdb -c "\\copy (SELECT * FROM sales.orders WHERE day = current_date - 1) TO /reports/o.csv CSV HEADER"</code>. Note <b>\\copy</b> reads and writes files on the <b>client</b>; plain <code>COPY</code> uses files on the <b>server</b> and needs elevated rights.'},
{t:'warn',x:'Without <code>ON_ERROR_STOP</code> a failed script keeps running and can leave a half-applied change. Always set it for deployments.'},
{t:'h',s:1,x:'5. pgAdmin and DBeaver'},
{t:'tbl',h:['','psql','pgAdmin','DBeaver'],r:[['Type','CLI','Web/desktop GUI for PostgreSQL only','Universal GUI (many databases)'],['Strengths','Scriptable, on every server, fast','Server dashboard, backup/restore dialogs, query plan view','ER diagrams, data editing, export, works with Oracle and Redshift too'],['Weakness','Learning curve','Heavier, PostgreSQL-only','Less PostgreSQL admin depth'],['Typical use','Admin, automation','Day-to-day DBA tasks','Developers, mixed estates']]},
{t:'steps',i:['Get host, port, database, user (and whether SSL is required).','In pgAdmin: right-click Servers, Register, Server. In DBeaver: New Connection, PostgreSQL.','Fill the Connection tab; use SSL mode require for remote servers.','If the DB is in a private network, add an SSH tunnel tab (bastion host).','Press Test Connection, then save.']},
{t:'tip',x:'If the test fails, check in order: network and firewall, <code>listen_addresses</code>, <code>pg_hba.conf</code>, then credentials. The error text usually says which.'},
{t:'h',s:1,x:'6. From SQL*Plus to psql, and a lab'},
{t:'tbl',h:['SQL*Plus','psql'],r:[['DESC emp','<code>\\d emp</code>'],['SHOW USER','<code>\\conninfo</code> or <code>SELECT current_user</code>'],['@script.sql','<code>\\i script.sql</code>'],['SPOOL out.txt','<code>\\o out.txt</code>'],['SET TIMING ON','<code>\\timing</code>'],['SELECT * FROM user_tables','<code>\\dt</code>'],['/ (run buffer)','<code>;</code> or <code>\\g</code>'],['EXIT','<code>\\q</code>']]},
{t:'steps',i:['Run <code>\\set ECHO_HIDDEN on</code> then <code>\\dt</code> and read the SQL it prints.','Run <code>\\x auto</code> then <code>SELECT * FROM pg_stat_activity;</code>.','Run <code>\\timing</code> and <code>SELECT pg_sleep(1);</code>.','Write a one-line script that uses <code>-v</code> and run it with <code>-f</code>.']},
{t:'h',s:1,x:'Key takeaways'},
{t:'chk',q:'Your cron script must stop at the first SQL error. Which setting?',o:['-At','ON_ERROR_STOP=1','\\timing','\\x auto'],a:1,e:'ON_ERROR_STOP aborts the script on the first error.'},
{t:'list',i:['psql is the DBA default; learn \\d, \\dt, \\l, \\du, \\x, \\timing first.','Use ECHO_HIDDEN to see how catalog queries work.','~/.pgpass and ~/.psqlrc make daily work smooth.','Script with -f, -v, -At and ON_ERROR_STOP.','pgAdmin for PostgreSQL admin tasks, DBeaver for mixed databases.']}];

LH.L['postgresql:1:4']=[
{t:'h',s:1,x:'1. The PGDATA map'},
{t:'p',x:'<b>PGDATA</b> is the one directory that holds the whole cluster. Find it with <code>SHOW data_directory;</code>.'},
{t:'tbl',h:['Item','Holds','Safe to touch?'],r:[
['<code>base/</code>','One sub-directory per database, holding table and index files','Never by hand'],
['<code>global/</code>','Cluster-wide catalogs (roles, databases) and pg_control','Never'],
['<code>pg_wal/</code>','Write-ahead log segments (16MB each)','Never delete; fix the cause of growth'],
['<code>pg_xact/</code>','Commit status of every transaction','Never'],
['<code>pg_multixact/ pg_subtrans/ pg_commit_ts/</code>','Row-lock, subtransaction and commit-time bookkeeping','Never'],
['<code>pg_tblspc/</code>','Symbolic links to tablespaces','Managed by SQL'],
['<code>pg_replslot/</code>','Replication slot state','Managed by SQL'],
['<code>pg_stat/</code>','Saved statistics','No'],
['<code>PG_VERSION</code>','Major version number','No'],
['<code>postmaster.pid</code>','PID of running server; blocks double start','Only if stale after a crash']]},
{t:'warn',x:'Old guides mention <code>pg_xlog</code> and <code>pg_clog</code>. They were renamed <b>pg_wal</b> and <b>pg_xact</b> in PostgreSQL 10, partly because admins deleted "log" directories to save space and destroyed their databases.'},
{t:'h',s:1,x:'2. Inside base/ and relation files'},
{t:'flow',s:['SELECT oid, datname FROM pg_database  gives the folder name','base/16384/ is that database','SELECT pg_relation_filepath(table)  gives base/16384/16401','Files 16401, 16401_fsm, 16401_vm, 16401.1 ...']},
{t:'tbl',h:['File','Meaning'],r:[['<code>16401</code>','Main data (the heap), first 1GB'],['<code>16401.1</code>, <code>.2</code>','Further 1GB segments'],['<code>16401_fsm</code>','Free space map'],['<code>16401_vm</code>','Visibility map (used by VACUUM and index-only scans)'],['<code>pg_filenode.map</code>','Maps system catalogs to files']]},
{t:'tip',x:'The file number (relfilenode) can change: <code>VACUUM FULL</code>, <code>TRUNCATE</code> and some <code>ALTER TABLE</code> commands write a new file. Always ask the server with <code>pg_relation_filepath()</code>.'},
{t:'chk',q:'A table file is 3.4GB. How is it stored?',o:['One file','Four 1GB-segment files (.1 to .3 for the rest)','Four tablespaces','In pg_wal'],a:1,e:'Files are split into 1GB segments.'},
{t:'h',s:1,x:'3. Configuration files'},
{t:'tbl',h:['File','Purpose','Edit how'],r:[['<code>postgresql.conf</code>','Main settings: memory, connections, logging, replication','Text editor'],['<code>postgresql.auto.conf</code>','Settings written by <code>ALTER SYSTEM</code>; read after postgresql.conf and overrides it','Use ALTER SYSTEM, not an editor'],['<code>pg_hba.conf</code>','Who may connect from where, and how they authenticate','Text editor, then reload'],['<code>pg_ident.conf</code>','Maps OS or certificate names to database roles','Text editor, then reload']]},
{t:'h',x:'Which value wins?'},
{t:'flow',s:['Built-in default','postgresql.conf (and included files)','postgresql.auto.conf (ALTER SYSTEM)','Command-line option of postgres/pg_ctl','ALTER DATABASE ... SET','ALTER ROLE ... SET','SET in the session (SET LOCAL: this transaction only)']},
{t:'p',x:'Later steps win. Every setting has a <b>context</b> that tells you how to apply a change:'},
{t:'tbl',h:['Context','To apply','Example'],r:[['postmaster','<b>Restart</b>','shared_buffers, max_connections'],['sighup','<b>Reload</b>: <code>SELECT pg_reload_conf();</code>','log_min_duration_statement, autovacuum settings'],['superuser / user','<code>SET</code> in a session','work_mem, search_path']]},
{t:'code',x:`SHOW config_file;  SHOW hba_file;
ALTER SYSTEM SET log_min_duration_statement = '500ms';
SELECT pg_reload_conf();
SELECT name, setting, source, context, pending_restart
FROM pg_settings WHERE name IN ('work_mem','shared_buffers');`},
{t:'h',s:1,x:'4. pg_hba.conf in detail'},
{t:'code',x:`# TYPE   DATABASE     USER      ADDRESS        METHOD
local    all          postgres                 peer
local    all          all                      scram-sha-256
host     appdb        app_user  10.0.1.0/24    scram-sha-256
hostssl  all          all       10.0.0.0/16    scram-sha-256
host     replication  repl      10.0.2.5/32    scram-sha-256`},
{t:'list',i:['Rules are read <b>top to bottom; the first match wins</b>. Put specific rules before general ones.','<code>local</code> = Unix socket, <code>host</code> = TCP, <code>hostssl</code> = TCP with SSL only.','No matching line means the connection is rejected.','Check the result with <code>SELECT * FROM pg_hba_file_rules;</code> (shows syntax errors too).']},
{t:'warn',x:'<code>trust</code> lets anyone in with no password. Never use it on a network-reachable line.'},
{t:'chk',q:'Remote login fails with "no pg_hba.conf entry". Where do you look first?',o:['postgresql.conf shared_buffers','pg_hba.conf for a matching host line','pg_wal','base/'],a:1,e:'That message means no rule matched; add one and reload.'},
{t:'h',s:1,x:'5. Paths by platform, and logs'},
{t:'tbl',h:['','Debian / Ubuntu','RHEL / Rocky'],r:[['Data','<code>/var/lib/postgresql/17/main</code>','<code>/var/lib/pgsql/17/data</code>'],['Config files','<code>/etc/postgresql/17/main/</code> (separate from data)','Inside the data directory'],['Binaries','<code>/usr/lib/postgresql/17/bin</code>','<code>/usr/pgsql-17/bin</code>'],['Logs','<code>/var/log/postgresql/</code>','<code>log/</code> inside data (logging_collector)']]},
{t:'p',x:'Key logging settings: <code>logging_collector</code>, <code>log_directory</code>, <code>log_min_duration_statement</code> (log slow queries), <code>log_line_prefix</code>, <code>log_checkpoints</code>, <code>log_connections</code>. Detail comes in Phase 6.'},
{t:'h',s:1,x:'6. What fills the disk, and a lab'},
{t:'ex',x:'At 3 a.m. the database server hits 100% disk and stops. The directory that grew is <code>pg_wal/</code>. Root cause: a replica was shut down but its <b>replication slot</b> stayed, so the primary kept every WAL file for it. Fix: check <code>SELECT slot_name, active, restart_lsn FROM pg_replication_slots;</code>, drop the unused slot with <code>pg_drop_replication_slot()</code>, and WAL is recycled at the next checkpoint. Deleting files by hand would have destroyed the cluster.'},
{t:'tbl',h:['Growing directory','Usual cause'],r:[['pg_wal','Stuck replication slot, failing archive_command, long checkpoint settings'],['base','Table or index bloat, large data, temp files'],['log','Verbose logging with no rotation'],['pgsql_tmp (inside base)','Huge sorts spilling to disk']]},
{t:'steps',i:['<code>SHOW data_directory;</code> then <code>ls -l</code> it as the postgres user.','<code>SELECT oid, datname FROM pg_database;</code> and match to folders in base/.','Create a table and run <code>SELECT pg_relation_filepath(\'demo\');</code>.','Run <code>du -sh pg_wal base log</code> to see where space goes.','Run <code>SELECT * FROM pg_hba_file_rules;</code> and read your rules.']},
{t:'h',s:1,x:'Key takeaways'},
{t:'chk',q:'You change shared_buffers in postgresql.conf. What must you do?',o:['pg_reload_conf()','Restart the server','Nothing','VACUUM'],a:1,e:'shared_buffers has postmaster context and needs a restart.'},
{t:'list',i:['PGDATA holds everything: base (data), global, pg_wal, pg_xact, config.','Never delete from pg_wal or pg_xact; find why they grow.','Ask the server for file paths and config locations; do not guess.','Setting precedence: default, conf, auto.conf, command line, database, role, session.','pg_hba.conf is first-match-wins; test with pg_hba_file_rules.']}];

LH.Q['postgresql:1'].push(
{q:'Which statement is true on RHEL after installing the server package?',o:['A cluster already exists','You must run the setup initdb command','PostgreSQL uses no data directory','Config lives in /etc/postgresql'],a:1,e:'RHEL packages do not create a cluster automatically; Debian ones do.'},
{q:'What is shared by all databases in one cluster?',o:['Schemas','Roles','Tables','search_path'],a:1,e:'Roles and tablespaces are cluster-wide.'},
{q:'Which psql command lists tables?',o:['\\l','\\dt','\\du','\\dn'],a:1,e:'\\dt lists tables; \\l lists databases.'},
{q:'Why use \\copy instead of COPY in a client script?',o:['It is faster','It reads and writes files on the client machine','It skips constraints','It needs superuser'],a:1,e:'\\copy works with client-side files without server file access.'},
{q:'pg_hba.conf rules are evaluated:',o:['Bottom to top','All at once','Top to bottom, first match wins','Alphabetically'],a:2,e:'The first matching line decides; later lines are ignored.'},
{q:'pg_wal is growing without limit. What is a common cause?',o:['A stuck replication slot','Too many schemas','A missing pg_hba line','Low work_mem'],a:0,e:'An unused replication slot makes the primary keep WAL forever.'});
