import re
import requests

from bs4 import BeautifulSoup

from FlaskApp.database import Db
from FlaskApp.model import get_travel_time


def get_three_best_routes(data, search_pref, date_time):
    """Returns three JPID's based on search preference"""

    if search_pref == "searchByWalkingDistance":
        return get_three_routes_based_on_walking_distance(data)
    elif search_pref == "searchByFare":
        return get_three_routes_based_on_fare(data)
    else:
        return get_three_routes_based_on_arrival_time(data, date_time)


def sort_function(data):
    """Returns a 2d array sorted by the first column

    Needed to sort the list of journeys by price and arrival time later"""

    return sorted(data, key=lambda x: x[0])


def get_three_routes_based_on_arrival_time(data, date_time):
    """Return three routes which arrive the soonest"""

    routes = list()

    for index, journey in data.items():

        jpid = journey['JPID_Source']
        source = journey['STOP_ID_Source']
        destination = journey['Stop_ID_Destination']

        # Get the model's travel time predictions
        travel_times = get_distance_and_predict_with_model(jpid, source, destination, date_time)

        try:
            # The time the bus arrives HH:MM:SS
            time_bus_arrives = find_time_bus_arrives(travel_times, date_time, jpid, source, destination)
            routes.append([time_bus_arrives, jpid, source, destination])
        except:
            pass

    routes = sort_function(routes)  # Sort it by the next to arrive

    if len(routes) == 2:
        return [routes[0], routes[1]]
    elif len(routes) == 1:
        return [routes[0]]
    elif len(routes) == 0:
        return "No Journey Found"
    else:
        return [routes[0], routes[1], routes[2]]


def find_time_bus_arrives(travel_times, date_time, jpid, source, destination):
    """Find the actual time the bus arrives"""

    time_to_source = travel_times[1]
    time_cat = get_time_cat(date_time[1])

    time_bus_arrives = Db().get_bus_time_for_map(str(jpid), int(source), int(destination), float(time_to_source), str(time_cat))

    return time_bus_arrives


def get_time_cat(day):
    """Returns the correct day (format-wise) for the model's features"""

    if day == 0:
        ans = "Sun"
    elif day == 6:
        ans = "Sat"
    else:
        ans = "Mon-Fri"

    return ans


def get_distance_and_predict_with_model(jpid, source, destination, date_time):
    """Get travel time of route"""

    distances = Db().get_distance(jpid, source, destination)
    travel_times = get_travel_time(jpid, distances.loc[0, "Distance"], distances.loc[1, "Distance"], date_time[0])

    return travel_times


def get_three_routes_based_on_fare(data):
    """Return the three most inexpensive routes"""

    routes = list()

    for index, journey in data.items():
        fare = "3.10 Euros"
        jpid = journey['JPID_Source']
        stop1 = journey['STOP_ID_Source']
        stop2 = journey['Stop_ID_Destination']
        direction = jpid[4:5]

        try:
            # get lineid and stop numbers of those stops
            df = Db().get_stop_numbers(jpid, stop1, stop2)
            lineid = df.loc[0, "Line_ID"]

            # convert upper cases to lower cases letter
            lineid = lineid.lower()

            stop_number1 = df.loc[0, "Stop_number"]
            stop_number1 = int(stop_number1) + 1
            stop_number2 = int(df.loc[1, "Stop_number"]) + 1

            try:
                # change direction parsing for url but sometimes o and I are switched
                # must account for this and try both ways
                if direction == '0' or direction == 0:
                    direction = 'I'
                else:
                    direction = 'O'

                article_url = "https://www.dublinbus.ie/Fare-Calculator/Fare-Calculator-Results/?routeNumber=" + str(
                    lineid) + "&direction=" + str(direction) + "&board=" + str(stop_number1) + "&alight=" + str(
                    stop_number2)

                fare = get_prices(article_url)["Adult Leap"]

            except Exception as e:
                if direction == '0' or direction == 0:
                    direction = 'O'
                else:
                    direction = 'I'

                article_url = "https://www.dublinbus.ie/Fare-Calculator/Fare-Calculator-Results/?routeNumber=" + str(
                    lineid) + "&direction=" + str(direction) + "&board=" + str(stop_number1) + "&alight=" + str(
                    stop_number2)

                fare = get_prices(article_url)["Adult Leap"]

        except Exception as e:
            if stop_number2 - stop_number1 <= 10:
                article_url = "https://www.dublinbus.ie/Fare-Calculator/Fare-Calculator-Results/?routeNumber=140&direction=I&board=0&alight=10"

            elif stop_number2 - stop_number1 <= 30:
                article_url = "https://www.dublinbus.ie/Fare-Calculator/Fare-Calculator-Results/?routeNumber=140&direction=I&board=0&alight=31"

            else:
                article_url = "https://www.dublinbus.ie/Fare-Calculator/Fare-Calculator-Results/?routeNumber=140&direction=I&board=9&alight=46"
                fare = get_prices(article_url)["Adult Leap"]
            pass

        routes.append([fare, jpid, stop1, stop2])

    routes = sort_function(routes)  # Sort it by the next to arrive

    if len(routes) == 2:
        return [routes[0], routes[1]]
    elif len(routes) == 1:
        return [routes[0]]
    elif len(routes) == 0:
        return "No Journey Found"
    else:
        return [routes[0], routes[1], routes[2]]


def get_prices(article_url):
    """Get leap card price information into a dictionary"""

    # Get table with prices from url
    try:
        page = requests.get(article_url)
        soup = BeautifulSoup(page.text, "html.parser")
        table = soup.find("div", class_="other-fares-display")
        rows = table.findChildren(['th', 'tr'])
    
        # Organise price table into in a dictionary e.g. Adult prices : 2.4 Euros etc...
        count = 0
        dictionary = dict()
    
        for row in rows:
            cells = row.findChildren('td')
            for cell in cells:
    
                # We want to stop here, the next cell is None
                if count > 11:
                    break
    
                value = cell.string.strip()
    
                # Even rows, these are our key pairs in dictionary, ie labels
                if count % 2 == 0:
                    key = value
    
                # Uneven rows, these are our value pairs in dictionary, ie prices
                else:
                    value = re.findall(r'\d+', value)
                    dictionary[key] = str(value[0]) + "." + str(value[1]) + " Euros"
    
                count += 1
    
        return dictionary
    
    # If http request to url fails, we craft a default response
    except:

        return {"Adult Cash": "2.70 Euros", "Adult Leap": "2.05 Euros",
                "Child Cash (Under 16)": "1.15 Euros",
                "Child Leap (Under 19)": "0.90 Euros",
                "School Hours Cash": "1.00 Euros", "School Hours Leap": "0.79 Euros"}


def get_three_routes_based_on_walking_distance(data):
    """Return the three closest routes"""

    routes = list()

    for index, item in data.items():

        route = [item['Minimum_Total_Walking'], item['JPID_Source'], item['STOP_ID_Source'], item['Stop_ID_Destination']]
        routes.append(route)

    routes = sort_function(routes)

    if len(routes) == 2:
        return [routes[0], routes[1]]
    elif len(routes) == 1:
        return [routes[0]]
    elif len(routes) == 0:
        return "No Journey Found"
    else:
        return [routes[0], routes[1], routes[2]]
