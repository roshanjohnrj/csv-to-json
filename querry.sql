create table users(
	"name" varchar not null,(name=firsttName+lastName)
	age int4 not null ,
	address jsonb null,
	additional_info jsonb null,
	id serial4 not null
);

insert into users(name,age)
select data->>'name' as name,
       (data->>age)::integer as age
from json_populate_recordset(null::users,$1 )as data;	   


insert into users(name,age,address,additional_info)
select * from json_to_recordset($1::jsonb)
as x(name varchar,age int4,address jsonb ,additional_info jsonb)