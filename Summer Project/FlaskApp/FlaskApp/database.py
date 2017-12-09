import json
import pandas as pd
import re

from flask import jsonify
from sqlalchemy import create_engine

from FlaskApp.db_info import name, password, rds_host, port, db_name

class Db:

    def __init__(self):
        """connect to database"""
        
        #private data field
        self.__conn = create_engine("mysql+pymysql://{}:{}@{}:{}/{}".format(name, password, rds_host,
                                                                                 port, db_name), echo=False)

    def disconnect(self):
        """Close connection"""

        self.__conn.dispose()

    def get_line_ids(self):
        """Query a list of all Line ID's"""
        
        sql1 = "SELECT DISTINCT Line_ID FROM JPID_LineID_Start_End ORDER BY Line_ID + 0 DESC;"
        rows = self.__conn.execute(sql1).fetchall()
        self.disconnect()

        return jsonify(lineids=[dict(row.items()) for row in rows])
    
    def get_selected_route_timetable(self, line_id):
        """return the timetable of the selected line ID"""
        
        sql12 = """
        SELECT tbl.Journey_Pattern_ID, tbl.Day_Cat, tbl.Time_no_date
        FROM Timetable AS tbl
        WHERE tbl.Journey_Pattern_ID IN (SELECT x.Main_Journey_Pattern_ID 
                                        FROM JPID_LineID_Start_End AS x
                                        WHERE x.Line_ID = %(line_id)s)
        """
        
        df = pd.read_sql_query(sql12, self.__conn, params={"line_id": line_id})
        
        self.disconnect()

        df.Time_no_date = df.Time_no_date.astype(str)
        # format string time_no_date
        # delete 0 days e.g. 0 days 10:40:00.000000000 will become 10:40:00.000000000
        df.Time_no_date = df.Time_no_date.apply(lambda x: re.sub('0 days ', '', x))
        # delete everything after and incuding .  e.g. 10:40:00.000000000 will become 10:40:00
        df.Time_no_date = df.Time_no_date.apply(lambda x: re.sub('\..*', '', x))

        return json.dumps(json.loads(df.to_json(orient='index')))

    def get_first_and_last_address(self, line_id):
        """Return the first and last address of both directions for a Line ID

        This must use journey pattern id's which end in '001', anything else is a sub-route. We need this so the
        user can pick a direction and we can display the appropriate information."""

        sql2 = """
        SELECT third_query.Journey_Pattern_ID, third_query.Short_Address_Source, fourth_query.Short_Address_Destination
        FROM         
                (SELECT *        
                FROM
                        (SELECT j.Source_Stop_ID, j.Destination_Stop_ID, j.Journey_Pattern_ID
                        FROM JPID_LineID_Start_End AS j
                        WHERE j.Journey_Pattern_ID IN (SELECT x.Main_Journey_Pattern_ID 
                                                FROM JPID_LineID_Start_End AS x
                                                WHERE x.Line_ID = %(line_id)s ) ) AS first_query
                    
                INNER JOIN

                        (SELECT s.Stop_ID AS Stop_ID1, s.Short_Address as Short_Address_Source
                        FROM Stop_ID_Address AS s) AS second_query
                
                ON first_query.Source_Stop_ID = second_query.Stop_ID1) AS third_query

        INNER JOIN

                (SELECT s.Stop_ID AS Stop_ID2, s.Short_Address as Short_Address_Destination
                FROM Stop_ID_Address AS s) AS fourth_query
        
        ON third_query.Destination_Stop_ID = fourth_query.Stop_ID2
        """
        
        df = pd.read_sql_query(sql2, self.__conn, params={"line_id": line_id})
        
        self.disconnect()
        
        return json.dumps(json.loads(df.to_json(orient='records')),ensure_ascii=False)

    def get_stop_id(self, jpid):
        """Get the stop ID's for a given line ID in a single direction

        When the user clicks a certain direction we must display options for the source and destination
        stop. Must distinguish between main route and the sub routes to inform the user if the particular bus they are taking will go to where they want (a sub route
        will not travel the whole route. Object returned must allow easy access to main and sub route
        information."""

        sql3 = """
        SELECT j.Stop_ID as Stop_info, j.Distance, j.Stop_ID
        FROM JourneyPatternID_StopID as j
        WHERE j.Journey_Pattern_ID = %(jpid)s
        ORDER BY j.Distance ASC
        """

        df = pd.read_sql_query(sql3, self.__conn, params={"jpid": jpid})
        
        self.disconnect()
        
        return json.dumps(json.loads(df.to_json(orient='index')),ensure_ascii=True).encode('latin-1')

    def get_addresses(self, jpid):
        """Get the addresses for a given line ID in a single direction

        When the user clicks a certain direction we must display options for source and destination
        stops. It is also important to distinguish between the main route and the sub routes. Object returned must allow easy access to the main and sub route
        information.

        This needs to return both Journey Pattern ID's for both directions."""

        sql4 = """
        SELECT s.Stop_ID, j.Distance, s.Address as Stop_info
        FROM JourneyPatternID_StopID as j, Stop_ID_Address as s
        WHERE j.Journey_Pattern_ID = %(jpid)s AND j.Stop_ID = s.Stop_ID
        ORDER BY j.Distance ASC
        """

        df = pd.read_sql_query(sql4, self.__conn, params={"jpid": jpid})
        
        self.disconnect()
        
        return json.dumps(json.loads(df.to_json(orient='index')))

    def get_distance(self, jpid, source, destination):
        """Returns the source and destination as distances"""
        
        sql5 = """
        SELECT s.Stop_ID, j.Distance
        FROM JourneyPatternID_StopID AS j, Stop_ID_Address AS s
        WHERE (s.Stop_ID = %(source)s
                OR s.Stop_ID = %(destination)s) AND j.Stop_ID = s.Stop_ID AND j.Journey_Pattern_ID = %(jpid)s
        ORDER BY j.Distance ASC
        """
            
        df = pd.read_sql_query(sql5, self.__conn, params={"jpid" : jpid, "source": source, "destination":destination })
        
        self.disconnect()
        
        return df

    def get_best_route(self, source_lat, source_lon, destination_lat, destination_lon):
        """Returns the closest route to a source and destination GPS"""

        sql8 = """
        SELECT fifth_query.JPID_Source, fifth_query.STOP_ID_Source, fifth_query.Distance_Source,
            fifth_query.Stop_ID_Destination, fifth_query.Distance_destination,  fifth_query.Minimum_Total_Walking
    
        FROM         
            
            (SELECT *       
            FROM
                    (SELECT first_query.JPID_Source, first_query.STOP_ID_Source, first_query.Distance_Source,
                        second_query.STOP_ID_Destination, second_query.Distance_Destination,
    
                        first_query.Distance_Source + second_query.Distance_Destination as Minimum_Total_Walking
    
                    FROM
    
                        (SELECT j.Journey_Pattern_ID as JPID_Source, j.Stop_ID as STOP_ID_Source,
                        ( 6371 * 
                            ACOS( 
                                COS( RADIANS( s.Latitude ) ) * 
                                COS( RADIANS( %(source_lat)s ) ) * 
                                COS( RADIANS( %(source_lon)s ) - 
                                RADIANS( s.Longitude ) ) + 
                                SIN( RADIANS( s.Latitude  ) ) * 
                                SIN( RADIANS( %(source_lat)s) ) 
                            ) 
                        ) AS Distance_Source
                        
                        FROM JourneyPatternID_StopID as j, Stop_ID_Address as s
                        WHERE j.Stop_ID = s.Stop_ID
                        HAVING Distance_Source <= 1.0) as first_query
    
                    INNER JOIN
    
                        (SELECT j.Journey_Pattern_ID as JPID_Destination, j.Stop_ID as STOP_ID_Destination,
                        ( 6371 * 
                            ACOS( 
                                COS( RADIANS( s.Latitude ) ) * 
                                COS( RADIANS( %(destination_lat)s ) ) * 
                                COS( RADIANS( %(destination_lon)s ) - 
                                RADIANS( s.Longitude ) ) + 
                                SIN( RADIANS( s.Latitude  ) ) * 
                                SIN( RADIANS( %(destination_lat)s ) ) 
                        ) 
                        ) AS Distance_Destination
                        
                        FROM JourneyPatternID_StopID as j, Stop_ID_Address as s
                        WHERE j.Stop_ID = s.Stop_ID
                        HAVING Distance_Destination <= 1.0) as second_query
    
                    ON first_query.JPID_Source = second_query.JPID_Destination
                    ) AS third_query
                    
            INNER JOIN
    
                (SELECT jj.Distance AS STOP_ID_Source_Distance, jj.Journey_Pattern_ID, jj.Stop_ID
                FROM JourneyPatternID_StopID AS jj) AS fourth_query
                
            ON third_query.JPID_Source = fourth_query.Journey_Pattern_ID
            WHERE third_query.STOP_ID_Source = fourth_query.Stop_ID) AS fifth_query
            
        INNER JOIN
    
                (SELECT jj.Distance AS STOP_ID_Destination_Distance, jj.Journey_Pattern_ID, jj.Stop_ID as Stop_ID2
                FROM JourneyPatternID_StopID AS jj) AS sixth_query
                
        ON fifth_query.JPID_Source = sixth_query.Journey_Pattern_ID
        WHERE fifth_query.STOP_ID_Destination = sixth_query.Stop_ID2
            AND ( fifth_query.STOP_ID_Source_Distance <=  sixth_query.STOP_ID_Destination_Distance )
        ORDER BY fifth_query.Minimum_Total_Walking ASC
        
        
        """
        
        df = pd.read_sql_query(sql8, self.__conn, params={"source_lat": source_lat, "source_lon": source_lon, "destination_lat": destination_lat, "destination_lon": destination_lon})
        
        self.disconnect()
        
        # We need to delete duplicates from query
        # Get index of min value of Minimum_Total_Walking for each jpid_source
        idx = df.groupby(['JPID_Source'])['Minimum_Total_Walking'].transform(min) == df['Minimum_Total_Walking']
        df = df[idx]
        
        # Remove possible duplicates
        df.drop_duplicates('JPID_Source', inplace=True)

        return json.loads(df.to_json(orient='index'))

    def get_gps(self, jpid, srcStop, destStop):
        """Return the set of GPS coordinates for a given journey pattern id - necessary to draw routes with the polylines"""
        
        sql7 = """
        SELECT s.Latitude, s.Longitude, s.Stop_ID
        FROM JourneyPatternID_StopID as j, Stop_ID_Address as s
        WHERE j.Journey_Pattern_ID = %(jpid)s AND j.Stop_ID = s.Stop_ID
        AND j.Distance >= (SELECT j2.Distance
                            FROM JourneyPatternID_StopID AS j2
                            WHERE j2.Journey_Pattern_ID = %(jpid)s AND j2.Stop_ID = %(srcStop)s)
                            
        AND j.Distance <= (SELECT j3.Distance
                            FROM JourneyPatternID_StopID AS j3
                            WHERE j3.Journey_Pattern_ID = %(jpid)s AND j3.Stop_ID = %(destStop)s)
                                
        ORDER BY j.Distance ASC
        """

        df = pd.read_sql_query(sql7, self.__conn, params={"jpid": jpid, "srcStop": srcStop, "destStop": destStop})
        
        self.disconnect()
        
        return json.dumps(json.loads(df.to_json(orient='records')))
    
    def get_bus_time(self, jpidTruncated, srcStop, destStop, hour, minute, sec, sourceTime, timeCat):
        
        """
        Return time next bus is coming
        """
        
        # Takes as input (hour,min,sec) and outputs hour:min:sec
        sql9 = """
        SELECT j.Journey_Pattern_ID,
            ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s)) AS Time_bus_arrives
        FROM Timetable as t, JourneyPatternID_StopID as j
        WHERE j.Journey_Pattern_ID LIKE %(jpidTruncated)s AND j.Journey_Pattern_ID = t.Journey_Pattern_ID 
            AND (j.Stop_ID = %(srcStop)s OR j.Stop_ID = %(destStop)s) AND t.Day_Cat = %(timeCat)s
            AND MAKETIME ( %(hour)s,%(minute)s,%(sec)s ) <= ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s))
        ORDER BY TIMESTAMPDIFF(SECOND, ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s)), MAKETIME ( %(hour)s,%(minute)s,%(sec)s ) ) DESC
        LIMIT 1
        """
    
        df = pd.read_sql_query(sql9, self.__conn, params={"jpidTruncated": jpidTruncated,
                                                                   "srcStop": srcStop,
                                                                    "destStop": destStop,
                                                                    "hour": hour,
                                                                    "minute": minute,
                                                                    "sec": sec,
                                                                    "sourceTime": sourceTime,
                                                                    "timeCat": timeCat})
        
        self.disconnect()
        
        df.Time_bus_arrives = df.Time_bus_arrives.astype(str)
        # Format string time_no_date
        # Delete 0 days e.g. 0 days 10:40:00.000000000 will become 10:40:00.000000000
        df.Time_bus_arrives = df.Time_bus_arrives.apply(lambda x: re.sub('0 days ', '', x))
        # Delete everything after and including .  e.g. 10:40:00.000000000 will become 10:40:00
        df.Time_bus_arrives = df.Time_bus_arrives.apply(lambda x: re.sub('\..*', '', x))

        return json.dumps(json.loads(df.to_json(orient='index')))

    def get_bus_time_for_map(self, jpid, srcStop, destStop, sourceTime, timeCat):
        
        """
        Return time next bus is coming for map. Must be a specific JPID unlike the other query for final form

        Just return a string displaying the time the bus arrives...
        
        Use CURTIME() +1 hour to get current time in ireland
        """

        sql9 = """
        SELECT j.Journey_Pattern_ID,
            ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s)) AS Time_bus_arrives
        FROM Timetable as t, JourneyPatternID_StopID as j
        WHERE j.Journey_Pattern_ID = %(jpid)s  AND j.Journey_Pattern_ID = t.Journey_Pattern_ID 
            AND (j.Stop_ID = %(srcStop)s OR j.Stop_ID = %(destStop)s) AND t.Day_Cat = %(timeCat)s
            AND DATE_ADD(CURTIME(), INTERVAL 1 HOUR) <= ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s))
        ORDER BY TIMESTAMPDIFF(SECOND, ADDTIME(t.Time_no_date, SEC_TO_TIME(%(sourceTime)s)), DATE_ADD(CURTIME(), INTERVAL 1 HOUR) ) DESC
        LIMIT 1
        """
        
        df = pd.read_sql_query(sql9, self.__conn, params={"jpid": jpid,
                                                                   "srcStop": srcStop,
                                                                    "destStop": destStop,
                                                                    "sourceTime": sourceTime,
                                                                    "timeCat": timeCat})
        self.disconnect()
        
        df.Time_bus_arrives = df.Time_bus_arrives.astype(str)
        # Format string time_no_date
        # Delete 0 days e.g. 0 days 10:40:00.000000000 will become 10:40:00.000000000
        df.Time_bus_arrives = df.Time_bus_arrives.apply(lambda x: re.sub('0 days ', '', x))
        # Delete everything after and including .  e.g. 10:40:00.000000000 will become 10:40:00
        df.Time_bus_arrives = df.Time_bus_arrives.apply(lambda x: re.sub('\..*', '', x))

        return df.loc[0,"Time_bus_arrives"]

    def get_stop_numbers(self, jpid, stop1, stop2):
        
        sql11 = """
        
        SELECT jse.Line_ID, j.Stop_ID, j.Stop_number
        FROM JourneyPatternID_StopID as j, JPID_LineID_Start_End as jse
        WHERE (j.Stop_ID = %(stop1)s OR j.Stop_ID = %(stop2)s ) 
            AND j.Journey_Pattern_ID = %(jpid)s AND jse.Journey_Pattern_ID = j.Journey_Pattern_ID
        ORDER BY j.Stop_number ASC
        
        """
        
        df = pd.read_sql_query(sql11, self.__conn, params={"jpid": jpid,
                                                                   "stop1": stop1,
                                                                    "stop2": stop2
                                                                     })
        self.disconnect()
        
        return df

    def get_single_address(self, stop_id):
        """Get the addresses for a given stop ID

        This is for the map to display the address of the closest stops"""

        sql_12 = """
           SELECT Address
           FROM Stop_ID_Address
           WHERE (Stop_ID = %(stop_id)s)
           """

        df = pd.read_sql_query(sql_12, self.__conn, params={"stop_id": stop_id})
        
        self.disconnect()
        
        return df

