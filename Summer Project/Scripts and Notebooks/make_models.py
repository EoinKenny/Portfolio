import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle


# Average Accuracy
results = dict()

# load the model from disk
journey_pattern_ids = pickle.load(open('journey_pattern_ids.pickle', 'rb'))

# Make all the models
for journey in journey_pattern_ids:

    current = str(journey)


    """ Read in data """

    df = pd.read_hdf("cleaned_store.h5", key="table_name", where='Journey_Pattern_ID == "' + current + '"', columns=['Timestamp', "Journey_Pattern_ID", "Time_Frame", "Vehicle_Journey_ID", "Week_Day", "Distance", "TravelTime", "TimeCategory", "Rain"])
    df.columns = ["Timestamp", "JourneyPatternId", "TimeFrame", "VehicleJourneyId", "Day", "Distance", "TravelTime", "TimeCategory", "Rain"]


    """ Change Day Category """

    # Organise the Data
    df = df.sort_values(['TimeFrame', 'VehicleJourneyId', 'Timestamp'], ascending=True)

    # Clean up index
    df = df.reset_index()
    del df['index']

    df.Day = df.Day.astype("str")

    # Create group object to work with 
    gb = df.groupby(["TimeFrame"], as_index=False, group_keys=False)

    def change_day(group):
        
        day_num = group.Day.value_counts().index.tolist()[0]
        
        if day_num == '0' or day_num == '1' or day_num == '2' or day_num == '3' or day_num == '4':
            group.Day = 'Mon-Fri'
            
        if day_num == '5':
            group.Day = 'Sat'
            
        if day_num == '6':
            group.Day = 'Sun'
        
        return group

    df = gb.apply(change_day)

    df.Day = df.Day.astype("category")


    """ Create A Custom Speed Dictionary """

    # Get a list of the journey's days
    days = df.Day.value_counts().index.tolist()

    # Hold future answers
    avg_speeds = dict()

    # Add Days to Dictionary
    for item in days:
        avg_speeds[item] = dict()

    gb = df.groupby(["TimeFrame", "VehicleJourneyId"])

    def test(group):
        """Add average speeds to each time category
        
        We need to bin the time categories because every half houris too much, it causes colliniarity issues.
        To overcome this we bin each journey into 3 bigger ones. """
    
        median_dist = group.Distance.median()
        median_time = group.loc[group['Distance'] >= median_dist].TravelTime.iloc[0]

        median_speed = (median_dist) / median_time
                    
        try:
            avg_speeds[group.Day.tolist()[0]][group.TimeCategory.tolist()[0]] += [median_speed]
            
        except:
            avg_speeds[group.Day.tolist()[0]][group.TimeCategory.tolist()[0]] = [median_speed]


    gb.apply(test)

    # Sum up all average speeds to get the overall average speeds
    for key, item in avg_speeds.items():
    
        for key2, item2 in avg_speeds[key].items():
            
            avg_speeds[key][key2] = (float(sum(item2)/len(item2)))


    # Change this speed numbers into the bins slow, medium & fast
    for key, item in avg_speeds.items():

        slowest = min(avg_speeds[key].values())
        fastest = max(avg_speeds[key].values())

        diff = (fastest - slowest)

        div = diff / 3
        
        for key2, value2 in avg_speeds[key].items():
        
            if value2 <= slowest + div:
                avg_speeds[key][key2] = "Slow"

            elif value2 <= slowest + (div*2):
                avg_speeds[key][key2] = "Medium"

            else:
                avg_speeds[key][key2] = "Fast"

    # Save data structure for model reference later on server
    filename = current + '_speeds.pickle'
    pickle.dump(avg_speeds, open(filename, 'wb'))


    """ change Time Category To New Speed Category """

    df.columns = ["Timestamp", "JourneyPatternId", "TimeFrame", "VehicleJourneyId", "Day", "Distance", "TravelTime", "Speed", "Rain"]

    # Organise the Data
    df = df.sort_values(['TimeFrame', 'VehicleJourneyId', 'Timestamp'], ascending=True)

    # Clean up index
    df = df.reset_index()
    del df['index']

    # Create group object to work with 
    gb = df.groupby(["TimeFrame", "VehicleJourneyId"], as_index=False, group_keys=False)

    def change_day(group):
        """ Assigns the journey's custom speeds to the feature """

        day = group.Day.value_counts().index.tolist()[0]
        time_cat = group.Speed.value_counts().index.tolist()[0]
        
        # For Weekdays
        if day == 'Mon-Fri':
            if time_cat == "06:00:00":
                group.Speed = avg_speeds['Mon-Fri']['06:00:00']
            if time_cat == "06:30:00":
                group.Speed = avg_speeds['Mon-Fri']['06:30:00']
            if time_cat == "07:00:00":
                group.Speed = avg_speeds['Mon-Fri']['07:00:00']
            if time_cat == "07:30:00":
                group.Speed = avg_speeds['Mon-Fri']['07:30:00']
            if time_cat == "08:00:00":
                group.Speed = avg_speeds['Mon-Fri']['08:00:00']
            if time_cat == "08:30:00":
                group.Speed = avg_speeds['Mon-Fri']['08:30:00']
            if time_cat == "09:00:00":
                group.Speed = avg_speeds['Mon-Fri']['09:00:00']
            if time_cat == "09:30:00":
                group.Speed = avg_speeds['Mon-Fri']['09:30:00']
            if time_cat == "10:00:00":
                group.Speed = avg_speeds['Mon-Fri']['10:00:00']
            if time_cat == "10:30:00":
                group.Speed = avg_speeds['Mon-Fri']['10:30:00']
            if time_cat == "11:00:00":
                group.Speed = avg_speeds['Mon-Fri']['11:00:00']
            if time_cat == "11:30:00":
                group.Speed = avg_speeds['Mon-Fri']['11:30:00']
            if time_cat == "12:00:00":
                group.Speed = avg_speeds['Mon-Fri']['12:00:00']
            if time_cat == "12:30:00":
                group.Speed = avg_speeds['Mon-Fri']['12:30:00']
            if time_cat == "13:00:00":
                group.Speed = avg_speeds['Mon-Fri']['13:00:00']
            if time_cat == "13:30:00":
                group.Speed = avg_speeds['Mon-Fri']['13:30:00']
            if time_cat == "14:00:00":
                group.Speed = avg_speeds['Mon-Fri']['14:00:00']
            if time_cat == "14:30:00":
                group.Speed = avg_speeds['Mon-Fri']['14:30:00']
            if time_cat == "15:00:00":
                group.Speed = avg_speeds['Mon-Fri']['15:00:00']
            if time_cat == "15:30:00":
                group.Speed = avg_speeds['Mon-Fri']['15:30:00']
            if time_cat == "16:00:00":
                group.Speed = avg_speeds['Mon-Fri']['16:00:00']
            if time_cat == "16:30:00":
                group.Speed = avg_speeds['Mon-Fri']['16:30:00']
            if time_cat == "17:00:00":
                group.Speed = avg_speeds['Mon-Fri']['17:00:00']
            if time_cat == "17:30:00":
                group.Speed = avg_speeds['Mon-Fri']['17:30:00']
            if time_cat == "18:00:00":
                group.Speed = avg_speeds['Mon-Fri']['18:00:00']
            if time_cat == "18:30:00":
                group.Speed = avg_speeds['Mon-Fri']['18:30:00']
            if time_cat == "19:00:00":
                group.Speed = avg_speeds['Mon-Fri']['19:00:00']
            if time_cat == "19:30:00":
                group.Speed = avg_speeds['Mon-Fri']['19:30:00']
            if time_cat == "20:00:00":
                group.Speed = avg_speeds['Mon-Fri']['20:00:00']
            if time_cat == "20:30:00":
                group.Speed = avg_speeds['Mon-Fri']['20:30:00']
            if time_cat == "21:00:00":
                group.Speed = avg_speeds['Mon-Fri']['21:00:00']
            if time_cat == "21:30:00":
                group.Speed = avg_speeds['Mon-Fri']['21:30:00']
            if time_cat == "22:00:00":
                group.Speed = avg_speeds['Mon-Fri']['22:00:00']
            if time_cat == "22:30:00":
                group.Speed = avg_speeds['Mon-Fri']['22:30:00']
            if time_cat == "23:00:00":
                group.Speed = avg_speeds['Mon-Fri']['23:00:00']
            if time_cat == "23:30:00":
                group.Speed = avg_speeds['Mon-Fri']['23:30:00']
            if time_cat == "00:00:00":
                group.Speed = avg_speeds['Mon-Fri']['00:00:00']
            if time_cat == "00:30:00":
                group.Speed = avg_speeds['Mon-Fri']['00:30:00']
            if time_cat == "01:00:00":
                group.Speed = avg_speeds['Mon-Fri']['01:00:00']
            if time_cat == "01:30:00":
                group.Speed = avg_speeds['Mon-Fri']['01:30:00']
            if time_cat == "02:00:00":
                group.Speed = avg_speeds['Mon-Fri']['02:00:00']
            if time_cat == "02:30:00":
                group.Speed = avg_speeds['Mon-Fri']['02:30:00']
                
        # For Saturday
        if day == 'Sat':
            if time_cat == "06:00:00":
                group.Speed = avg_speeds['Sat']['06:00:00']
            if time_cat == "06:30:00":
                group.Speed = avg_speeds['Sat']['06:30:00']
            if time_cat == "07:00:00":
                group.Speed = avg_speeds['Sat']['07:00:00']
            if time_cat == "07:30:00":
                group.Speed = avg_speeds['Sat']['07:30:00']
            if time_cat == "08:00:00":
                group.Speed = avg_speeds['Sat']['08:00:00']
            if time_cat == "08:30:00":
                group.Speed = avg_speeds['Sat']['08:30:00']
            if time_cat == "09:00:00":
                group.Speed = avg_speeds['Sat']['09:00:00']
            if time_cat == "09:30:00":
                group.Speed = avg_speeds['Sat']['09:30:00']
            if time_cat == "10:00:00":
                group.Speed = avg_speeds['Sat']['10:00:00']
            if time_cat == "10:30:00":
                group.Speed = avg_speeds['Sat']['10:30:00']
            if time_cat == "11:00:00":
                group.Speed = avg_speeds['Sat']['11:00:00']
            if time_cat == "11:30:00":
                group.Speed = avg_speeds['Sat']['11:30:00']
            if time_cat == "12:00:00":
                group.Speed = avg_speeds['Sat']['12:00:00']
            if time_cat == "12:30:00":
                group.Speed = avg_speeds['Sat']['12:30:00']
            if time_cat == "13:00:00":
                group.Speed = avg_speeds['Sat']['13:00:00']
            if time_cat == "13:30:00":
                group.Speed = avg_speeds['Sat']['13:30:00']
            if time_cat == "14:00:00":
                group.Speed = avg_speeds['Sat']['14:00:00']
            if time_cat == "14:30:00":
                group.Speed = avg_speeds['Sat']['14:30:00']
            if time_cat == "15:00:00":
                group.Speed = avg_speeds['Sat']['15:00:00']
            if time_cat == "15:30:00":
                group.Speed = avg_speeds['Sat']['15:30:00']
            if time_cat == "16:00:00":
                group.Speed = avg_speeds['Sat']['16:00:00']
            if time_cat == "16:30:00":
                group.Speed = avg_speeds['Sat']['16:30:00']
            if time_cat == "17:00:00":
                group.Speed = avg_speeds['Sat']['17:00:00']
            if time_cat == "17:30:00":
                group.Speed = avg_speeds['Sat']['17:30:00']
            if time_cat == "18:00:00":
                group.Speed = avg_speeds['Sat']['18:00:00']
            if time_cat == "18:30:00":
                group.Speed = avg_speeds['Sat']['18:30:00']
            if time_cat == "19:00:00":
                group.Speed = avg_speeds['Sat']['19:00:00']
            if time_cat == "19:30:00":
                group.Speed = avg_speeds['Sat']['19:30:00']
            if time_cat == "20:00:00":
                group.Speed = avg_speeds['Sat']['20:00:00']
            if time_cat == "20:30:00":
                group.Speed = avg_speeds['Sat']['20:30:00']
            if time_cat == "21:00:00":
                group.Speed = avg_speeds['Sat']['21:00:00']
            if time_cat == "21:30:00":
                group.Speed = avg_speeds['Sat']['21:30:00']
            if time_cat == "22:00:00":
                group.Speed = avg_speeds['Sat']['22:00:00']
            if time_cat == "22:30:00":
                group.Speed = avg_speeds['Sat']['22:30:00']
            if time_cat == "23:00:00":
                group.Speed = avg_speeds['Sat']['23:00:00']
            if time_cat == "23:30:00":
                group.Speed = avg_speeds['Sat']['23:30:00']
            if time_cat == "00:00:00":
                group.Speed = avg_speeds['Sat']['00:00:00']
            if time_cat == "00:30:00":
                group.Speed = avg_speeds['Sat']['00:30:00']
            if time_cat == "01:00:00":
                group.Speed = avg_speeds['Sat']['01:00:00']
            if time_cat == "01:30:00":
                group.Speed = avg_speeds['Sat']['01:30:00']
            if time_cat == "02:00:00":
                group.Speed = avg_speeds['Sat']['02:00:00']
            if time_cat == "02:30:00":
                group.Speed = avg_speeds['Sat']['02:30:00']
                
        # For Sunday
        if day == 'Sun':
            if time_cat == "06:00:00":
                group.Speed = avg_speeds['Sun']['06:00:00']
            if time_cat == "06:30:00":
                group.Speed = avg_speeds['Sun']['06:30:00']
            if time_cat == "07:00:00":
                group.Speed = avg_speeds['Sun']['07:00:00']
            if time_cat == "07:30:00":
                group.Speed = avg_speeds['Sun']['07:30:00']
            if time_cat == "08:00:00":
                group.Speed = avg_speeds['Sun']['08:00:00']
            if time_cat == "08:30:00":
                group.Speed = avg_speeds['Sun']['08:30:00']
            if time_cat == "09:00:00":
                group.Speed = avg_speeds['Sun']['09:00:00']
            if time_cat == "09:30:00":
                group.Speed = avg_speeds['Sun']['09:30:00']
            if time_cat == "10:00:00":
                group.Speed = avg_speeds['Sun']['10:00:00']
            if time_cat == "10:30:00":
                group.Speed = avg_speeds['Sun']['10:30:00']
            if time_cat == "11:00:00":
                group.Speed = avg_speeds['Sun']['11:00:00']
            if time_cat == "11:30:00":
                group.Speed = avg_speeds['Sun']['11:30:00']
            if time_cat == "12:00:00":
                group.Speed = avg_speeds['Sun']['12:00:00']
            if time_cat == "12:30:00":
                group.Speed = avg_speeds['Sun']['12:30:00']
            if time_cat == "13:00:00":
                group.Speed = avg_speeds['Sun']['13:00:00']
            if time_cat == "13:30:00":
                group.Speed = avg_speeds['Sun']['13:30:00']
            if time_cat == "14:00:00":
                group.Speed = avg_speeds['Sun']['14:00:00']
            if time_cat == "14:30:00":
                group.Speed = avg_speeds['Sun']['14:30:00']
            if time_cat == "15:00:00":
                group.Speed = avg_speeds['Sun']['15:00:00']
            if time_cat == "15:30:00":
                group.Speed = avg_speeds['Sun']['15:30:00']
            if time_cat == "16:00:00":
                group.Speed = avg_speeds['Sun']['16:00:00']
            if time_cat == "16:30:00":
                group.Speed = avg_speeds['Sun']['16:30:00']
            if time_cat == "17:00:00":
                group.Speed = avg_speeds['Sun']['17:00:00']
            if time_cat == "17:30:00":
                group.Speed = avg_speeds['Sun']['17:30:00']
            if time_cat == "18:00:00":
                group.Speed = avg_speeds['Sun']['18:00:00']
            if time_cat == "18:30:00":
                group.Speed = avg_speeds['Sun']['18:30:00']
            if time_cat == "19:00:00":
                group.Speed = avg_speeds['Sun']['19:00:00']
            if time_cat == "19:30:00":
                group.Speed = avg_speeds['Sun']['19:30:00']
            if time_cat == "20:00:00":
                group.Speed = avg_speeds['Sun']['20:00:00']
            if time_cat == "20:30:00":
                group.Speed = avg_speeds['Sun']['20:30:00']
            if time_cat == "21:00:00":
                group.Speed = avg_speeds['Sun']['21:00:00']
            if time_cat == "21:30:00":
                group.Speed = avg_speeds['Sun']['21:30:00']
            if time_cat == "22:00:00":
                group.Speed = avg_speeds['Sun']['22:00:00']
            if time_cat == "22:30:00":
                group.Speed = avg_speeds['Sun']['22:30:00']
            if time_cat == "23:00:00":
                group.Speed = avg_speeds['Sun']['23:00:00']
            if time_cat == "23:30:00":
                group.Speed = avg_speeds['Sun']['23:30:00']
            if time_cat == "00:00:00":
                group.Speed = avg_speeds['Sun']['00:00:00']
            if time_cat == "00:30:00":
                group.Speed = avg_speeds['Sun']['00:30:00']
            if time_cat == "01:00:00":
                group.Speed = avg_speeds['Sun']['01:00:00']
            if time_cat == "01:30:00":
                group.Speed = avg_speeds['Sun']['01:30:00']
            if time_cat == "02:00:00":
                group.Speed = avg_speeds['Sun']['02:00:00']
            if time_cat == "02:30:00":
                group.Speed = avg_speeds['Sun']['02:30:00']
    
    
        return group

    df = gb.apply(change_day)


    """ Make RFR Model """

    try:
        # Get the mean travel_time
        mean_travel_time = df.describe().TravelTime["mean"]

        # Filter out journeys which go over 2 times the mean travelTime
        df = df[df.TravelTime < mean_travel_time*2]

        # Get dummies
        day_dummies = pd.get_dummies(df.Day)
        speed_dummies = pd.get_dummies(df.Speed)

        # Assign to df
        df = pd.concat([df, day_dummies], axis=1)
        df = pd.concat([df, speed_dummies], axis=1)

        df.TravelTime = df.TravelTime.astype("float")
        df.Distance = df.Distance.astype("float")

        # Add in case of no data
        if 'Mon-Fri' not in df:
            df["Mon-Fri"] = 0
        
        if 'Sat' not in df:
            df["Sat"] = 0
            
        if 'Sun' not in df:
            df["Sun"] = 0
            
        if 'Fast' not in df:
            df["Fast"] = 0
            
        if 'Medium' not in df:
            df["Medium"] = 0
            
        if 'Slow' not in df:
            df["Slow"] = 0

        # Get length of df
        length = len(df)

        # Make split
        X_train = df[:int(length * 0.75)]
        X_test = df[int(length * 0.75):]

        # Make target feature
        y_train = X_train.TravelTime
        y_test = X_test.TravelTime

        # Erase columns from X which are not part of the reggression
        del X_train["Timestamp"]
        del X_train["JourneyPatternId"]
        del X_train["TimeFrame"]
        del X_train["VehicleJourneyId"]
        del X_train["Day"]
        del X_train["Speed"]
        del X_train["Rain"]
        del X_train["TravelTime"]

        del X_test["Timestamp"]
        del X_test["JourneyPatternId"]
        del X_test["TimeFrame"]
        del X_test["VehicleJourneyId"]
        del X_test["Day"]
        del X_test["Speed"]
        del X_test["Rain"]
        del X_test["TravelTime"]

        # Create RFR object
        regr = RandomForestRegressor(n_estimators=2)

        # Train the model using the training sets
        regr.fit(X_train, y_train)

        # Get results
        average = np.mean(abs(abs(regr.predict(X_test)) - abs(y_test)))
        print(current, average)
        results[current] = average

        # save the model to disk
        filename = current + '.pickle'
        pickle.dump(regr, open(filename, 'wb'))

    except:
        # If it can't train etc.
        print(current, "Fail")
        results[current] = "Fail"

# Save the Accuracy Scores to disk
filename = 'RFR_2_accuracy.pickle'
pickle.dump(results, open(filename, 'wb'))
