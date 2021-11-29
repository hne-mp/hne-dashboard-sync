
-- spend fee wallet snapshot
delete  from "Snapshots"  where  "key"  in ('SUMMON','LIMIT_BREAK','SPEND_FEE');

insert into "Snapshots" ("createdAt","updatedAt","key","value")
 (with data as (
  select
    date_trunc('hour', a."create_time") as time,
    sum("amount")  as "amount"
  from (select create_time,"amount", "type" from "HotWalletTransfers" 
  where "type"  in ('SUMMON','LIMIT_BREAK','SPEND_FEE')) a
  group by  1
)
select
  time as createAt,
   time as updateAt,
   'USER_SPEND' as "key",
  sum("amount") over (order by time asc rows between unbounded preceding and current row) as "value" 
from data order by time);

-- hot wallet
delete  from "Snapshots"  where  "key"  in ('HOTWALLET');

insert into "Snapshots" ("createdAt","updatedAt","key","value")
 (with data as (
  select
    date_trunc('hour', a."create_time") as time,
    sum("amount")  as "amount"
  from (select create_time,"amount", "type" from "HotWalletTransfers" 
  where "type"  ='HOTWALLET') a
  group by  1
)
select
  time as createAt,
   time as updateAt,
   'HOTWALLET' as "key",
  sum("amount") over (order by time asc rows between unbounded preceding and current row) as "value" 
from data order by time);


-- total user
delete  from "Snapshots"  where  "key" = 'TOTAL_USER';
insert into "Snapshots" ("createdAt","updatedAt","key","value")
(with data as (
  select
    date_trunc('hour', a.create_time) as day,
    count(a.to_address) as total
  from (select to_address,min(create_time) as create_time from "TransferHeros" where to_address != '0x0000000000000000000000000000000000000000' group by to_address) a
  group by 1 
)
select
  day as createAt,
  day as udpatedAt,
  'TOTAL_USER' as "key",
  sum(total) over (order by day asc rows between unbounded preceding and current row) as "value"
from data)

-- total issued hero
delete  from "Snapshots"  where  "key" = 'TOTAL_HERO_ISSUED';
insert into "Snapshots" ("createdAt","updatedAt","key","value")
(with data as (
  select
    date_trunc('hour', create_time) as day,
   count(DISTINCT token_id) as total 
  from "TransferHeros" 
  where   from_address  = '0x0000000000000000000000000000000000000000'
  group by 1
)
select
 day as createAt,
  day as udpatedAt,
  'TOTAL_HERO_ISSUED' as "key",
  sum(total) over (order by day asc rows between unbounded preceding and current row)  as "value"
from data);

-- total burned hero
delete  from "Snapshots"  where  "key" = 'TOTAL_HERO_BURNED';
insert into "Snapshots" ("createdAt","updatedAt","key","value")
(with data as (
  select
    date_trunc('hour', create_time) as day,
   count(DISTINCT token_id) as total 
  from "TransferHeros" 
  where   to_address  = '0x0000000000000000000000000000000000000000'
  group by 1
)
select
   day as createAt,
  day as udpatedAt,
  'TOTAL_HERO_BURNED' as "key",
  sum(total)  over (order by day asc rows between unbounded preceding and current row) as "value"
from data);


