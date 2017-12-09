import os
import glob
import pandas as pd
import gc
import numpy as np

#change folder to where the csv files are
os.chdir("C:\\Users\\Daniele\\Desktop\\historical_data")


#match all csv files in the folder, these are all days of november 2012 and the last 3 weeks of January Dublin bus gps data from Dublinked
files = glob.glob("*.csv")

#name of my hdf5
hdf_path = 'cleaning_store.h5'

COLNAMES = ['Timestamp', 'Line_ID', 'Direction', 'Journey_Pattern_ID',
            'Time_Frame', 'Vehicle_Journey_ID', 'Bus_Operator', 'Congestion',
            'Longitude', 'Latitude', 'Delay_seconds', 'Block_ID',
            'Vehicle_ID', 'Stop_ID', 'At_Stop']

COLTYPES = {
    
    'Timestamp' : 'int64',
    'Line_ID' : 'object',
    'Direction' : 'int32',
    'Journey_Pattern_ID' : 'object',
    'Time_Frame' : 'object',
    'Vehicle_Journey_ID' : 'object',
    'Bus_Operator' : 'object',
    'Congestion' : 'int32',
    'Longitude' : 'float64',
    'Latitude' : 'float64',
    'Delay_seconds' : 'int32',
    'Block_ID' : 'object',
    'Vehicle_ID' : 'object',
    'Stop_ID' : 'object',
    'At_Stop' : 'int32'
    }


with pd.HDFStore(hdf_path, mode='w', complevel=5, complib='blosc') as store:
    # This compresses the final file by 5 using blosc. You can avoid that or
    # change it as per your needs.
    for filename in files:
        #cleaning part
        df = pd.read_csv(filename, names=COLNAMES, usecols=[0,1,3,4,5,6,8,9,10,11,12,13,14], dtype=COLTYPES)
        
        df.Timestamp = df.Timestamp//1000000
        
        #insert format yy-mm-dd
        df.Timestamp = pd.to_datetime(df['Timestamp'], unit='s')
        
        df.Time_Frame = pd.to_datetime(df['Time_Frame'])
        
        #replace strign null with NaN, to be deleted
        df.replace({'null': np.nan}, inplace=True)
        
        df.dropna(inplace=True)
        df.drop_duplicates(inplace=True)
        
        #dropping line_id after deleting 'null' values
        df.drop('Line_ID', axis=1, inplace=True)
        
        #filter first recorded day of november
        df = df[df.Time_Frame > '2012-11-05']
        
        #filter last record day of november
        df = df[df.Time_Frame != '2012-11-30']
        
        
        #filter first recorded day of january
        df = df[df.Time_Frame != '2013-01-06']
        
        #filter last record day of january
        df = df[df.Time_Frame < '2013-01-31']
        
        
        #0 is monday, 6 is sunday
        df['Week_Day'] = df['Time_Frame'].dt.dayofweek

        #appending cleaned file to hdf5
        store.append('table_name', df, index=False, data_columns = True)
        #deleting df reference and ask garbage collector to collect
        del df
        gc.collect()
    # Then create the indexes, if you need it
    #store.create_table_index('table_name', columns=["Week_Day"], optlevel=9, kind='full')